import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
    try {
        const body = await req.json();
        const { connection_id } = body;

        if (!connection_id) {
            return NextResponse.json(
                { error: "Connection ID is required" },
                { status: 400 }
            );
        }

        // Get the connection
        const { data: connection } = await supabase
            .from("integration_connections")
            .select("*")
            .eq("id", connection_id)
            .single();

        if (!connection) {
            return NextResponse.json(
                { error: "Connection not found" },
                { status: 404 }
            );
        }

        const { api_key, client_id, api_url } = connection.credentials;
        const baseUrl = api_url || "https://api.olaivraison.com";

        // Fetch shipments from Olaivraison
        const shipmentsRes = await fetch(`${baseUrl}/v1/shipments`, {
            headers: {
                "Authorization": `Bearer ${api_key}`,
                "X-Client-ID": client_id,
                "Content-Type": "application/json",
            },
        });

        if (!shipmentsRes.ok) {
            return NextResponse.json(
                { error: "Failed to fetch shipments from Olaivraison" },
                { status: 500 }
            );
        }

        const shipmentsData = await shipmentsRes.json();
        const shipments = shipmentsData.data || shipmentsData.shipments || [];

        let imported = 0;
        let updated = 0;

        for (const shipment of shipments) {
            const trackingNumber = shipment.tracking_number;
            const mappedStatus = mapOlaivraisonStatus(shipment.status);

            // Check if lead already exists
            const { data: existing } = await supabase
                .from("leads")
                .select("id")
                .or(`tracking_number.eq.${trackingNumber},external_id.eq.${trackingNumber}`)
                .single();

            if (existing) {
                await supabase
                    .from("leads")
                    .update({
                        status: mappedStatus,
                        delivery_status: shipment.status_label,
                        delivery_comment: shipment.comment,
                        delivery_date: shipment.updated_at,
                    })
                    .eq("id", existing.id);
                updated++;
            } else {
                await supabase.from("leads").insert({
                    tenant_id: connection.tenant_id,
                    customer: shipment.recipient_name || "Olaivraison Shipment",
                    phone: shipment.recipient_phone || "",
                    product: `Tracking: ${trackingNumber}`,
                    status: mappedStatus,
                    source: "olaivraison",
                    tracking_number: trackingNumber,
                    delivery_status: shipment.status_label,
                    delivery_comment: shipment.comment,
                    external_id: trackingNumber,
                    date: shipment.created_at || new Date().toISOString(),
                });
                imported++;
            }
        }

        return NextResponse.json({
            success: true,
            imported,
            updated,
            total: shipments.length,
        });
    } catch (err) {
        console.error("Olaivraison sync error:", err);
        return NextResponse.json(
            { error: err.message },
            { status: 500 }
        );
    }
}

function mapOlaivraisonStatus(status) {
    const mapping = {
        "delivered": "delivered",
        "in_transit": "shipped",
        "pending": "pending",
        "cancelled": "cancelled",
        "returned": "returned",
        "pickup": "shipped",
        "warehouse": "shipped",
    };
    return mapping[status] || "shipped";
}