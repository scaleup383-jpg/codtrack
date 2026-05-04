import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
    try {
        const contentType = req.headers.get("content-type") || "";
        let body;

        // Handle both JSON and form-encoded payloads
        if (contentType.includes("application/x-www-form-urlencoded")) {
            const formData = await req.formData();
            body = {};
            formData.forEach((value, key) => {
                try { body[key] = JSON.parse(value); }
                catch { body[key] = value; }
            });
        } else {
            body = await req.json();
        }

        console.log("📦 Aramex webhook received:", body);

        const trackingNumber = body.tracking_number || body.TrackingNumber || body.code;
        const status = body.status || body.Status || body.statut;
        const statusLabel = body.status_label || body.StatusLabel || body.statut_name;
        const comment = body.comment || body.Comment || "";
        const updatedAt = body.updated_at || body.UpdatedAt || body.date || new Date().toISOString();

        if (!trackingNumber) {
            return NextResponse.json(
                { error: "Missing tracking number" },
                { status: 400 }
            );
        }

        // Map Aramex status
        const statusMapping = {
            "delivered": "delivered",
            "in_transit": "shipped",
            "transit": "shipped",
            "out_for_delivery": "shipped",
            "pending": "pending",
            "cancelled": "cancelled",
            "canceled": "cancelled",
            "returned": "returned",
            "picked_up": "shipped",
            "on_hold": "pending",
            "in_progress": "shipped",
            "distribution": "shipped",
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
            const { data: integration } = await supabase
                .from("integrations")
                .select("id")
                .eq("slug", "aramex")
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
                        customer: body.recipient_name || body.customer_name || "Aramex Shipment",
                        phone: body.recipient_phone || body.phone || "",
                        product: `Tracking: ${trackingNumber}`,
                        status: mappedStatus,
                        source: "aramex",
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
        console.error("❌ Aramex webhook error:", err);
        return NextResponse.json(
            { error: err.message },
            { status: 500 }
        );
    }
}