import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
    try {
        const body = await req.json();

        console.log("📦 Onessta webhook received:", body);

        const trackingNumber = body.tracking_number || body.trackingNumber || body.code;
        const status = body.status;
        const statusLabel = body.status_label || body.statusLabel;
        const comment = body.comment || body.notes;
        const updatedAt = body.updated_at || body.updatedAt || new Date().toISOString();

        if (!trackingNumber) {
            return NextResponse.json(
                { error: "Missing tracking number" },
                { status: 400 }
            );
        }

        // Map Onessta status to system status
        const statusMapping = {
            "delivered": "delivered",
            "in_transit": "shipped",
            "transit": "shipped",
            "pending": "pending",
            "cancelled": "cancelled",
            "canceled": "cancelled",
            "returned": "returned",
            "picked_up": "shipped",
            "out_for_delivery": "shipped",
        };

        const mappedStatus = statusMapping[status?.toLowerCase()] || "shipped";

        // Find lead by tracking number
        const { data: existingLead } = await supabase
            .from("leads")
            .select("id, tenant_id, status")
            .or(`tracking_number.eq.${trackingNumber},external_id.eq.${trackingNumber}`)
            .single();

        if (existingLead) {
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

            console.log(`✅ Updated lead ${existingLead.id} to: ${mappedStatus}`);
        } else {
            // Get all active Onessta connections
            const { data: integration } = await supabase
                .from("integrations")
                .select("id")
                .eq("slug", "onessta")
                .single();

            if (integration) {
                const { data: connections } = await supabase
                    .from("integration_connections")
                    .select("tenant_id")
                    .eq("integration_id", integration.id)
                    .eq("status", "active");

                for (const conn of connections || []) {
                    await supabase.from("leads").insert({
                        tenant_id: conn.tenant_id,
                        customer: body.recipient_name || body.customer_name || "Onessta Shipment",
                        phone: body.recipient_phone || body.phone || "",
                        product: `Tracking: ${trackingNumber}`,
                        status: mappedStatus,
                        source: "onessta",
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
        console.error("❌ Onessta webhook error:", err);
        return NextResponse.json(
            { error: err.message },
            { status: 500 }
        );
    }
}