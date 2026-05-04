import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
    try {
        const body = await req.json();

        console.log("📦 Olaivraison webhook received:", body);

        // Olaivraison webhook payload structure:
        // {
        //   tracking_number: "OLV123456",
        //   status: "delivered" | "in_transit" | "pending" | "cancelled" | "returned",
        //   status_label: "Delivered",
        //   comment: "Package delivered to recipient",
        //   updated_at: "2024-01-15T10:30:00Z",
        //   recipient_name: "John Doe",
        //   recipient_phone: "+212600000000"
        // }

        const trackingNumber = body.tracking_number;
        const status = body.status;
        const statusLabel = body.status_label;
        const comment = body.comment;
        const updatedAt = body.updated_at || new Date().toISOString();

        if (!trackingNumber) {
            return NextResponse.json(
                { error: "Missing tracking number" },
                { status: 400 }
            );
        }

        // Map Olaivraison status to system status
        const statusMapping = {
            "delivered": "delivered",
            "in_transit": "shipped",
            "pending": "pending",
            "cancelled": "cancelled",
            "returned": "returned",
            "pickup": "shipped",
            "warehouse": "shipped",
        };

        const mappedStatus = statusMapping[status] || "shipped";

        // Find lead by tracking number
        const { data: existingLead } = await supabase
            .from("leads")
            .select("id, tenant_id, status")
            .or(`tracking_number.eq.${trackingNumber},external_id.eq.${trackingNumber}`)
            .single();

        if (existingLead) {
            // Update existing lead
            await supabase
                .from("leads")
                .update({
                    status: mappedStatus,
                    delivery_status: statusLabel,
                    delivery_comment: comment,
                    delivery_date: updatedAt,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", existingLead.id);

            console.log(`✅ Updated lead ${existingLead.id} to status: ${mappedStatus}`);
        } else {
            // Get all active Olaivraison connections
            const { data: integration } = await supabase
                .from("integrations")
                .select("id")
                .eq("slug", "olaivraison")
                .single();

            if (integration) {
                const { data: connections } = await supabase
                    .from("integration_connections")
                    .select("tenant_id, name")
                    .eq("integration_id", integration.id)
                    .eq("status", "active");

                // Create a new lead for each active tenant (or find the right one)
                for (const conn of connections || []) {
                    await supabase.from("leads").insert({
                        tenant_id: conn.tenant_id,
                        customer: body.recipient_name || "Olaivraison Shipment",
                        phone: body.recipient_phone || "",
                        product: `Tracking: ${trackingNumber}`,
                        status: mappedStatus,
                        source: "olaivraison",
                        tracking_number: trackingNumber,
                        delivery_status: statusLabel,
                        delivery_comment: comment,
                        delivery_date: updatedAt,
                        external_id: trackingNumber,
                        date: new Date().toISOString(),
                    });
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("❌ Olaivraison webhook error:", err);
        return NextResponse.json(
            { error: err.message },
            { status: 500 }
        );
    }
}