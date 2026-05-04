import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
    try {
        // Aramex sends data as application/x-www-form-urlencoded
        const contentType = req.headers.get("content-type") || "";
        let body;

        if (contentType.includes("application/x-www-form-urlencoded")) {
            const formData = await req.formData();
            body = {};
            formData.forEach((value, key) => {
                // Parse JSON fields if they're strings
                try {
                    body[key] = JSON.parse(value);
                } catch {
                    body[key] = value;
                }
            });
        } else {
            body = await req.json();
        }

        console.log("📦 Aramex webhook received:", body);

        const trackingCode = body.CODE;
        const status = body.STATUT;
        const statusName = body.STATUT_NAME;
        const comment = body.COMMENT;
        const date = body.DATE || new Date().toISOString();
        const subStatus = body.STATUT_S;
        const subStatusName = body.STATUT_S_NAME;

        if (!trackingCode) {
            return NextResponse.json(
                { error: "Missing tracking code" },
                { status: 400 }
            );
        }

        // Map Aramex status to our system status
        const statusMapping = {
            "DELIVERED": "delivered",
            "IN_PROGRESS": "shipped",
            "DISTRIBUTION": "shipped",
            "CANCELLED": "cancelled",
            "RETURNED": "returned",
        };

        const mappedStatus = statusMapping[status] || "shipped";

        // Find the lead by tracking number (stored in external_id or tracking field)
        const { data: existingLead } = await supabase
            .from("leads")
            .select("id, tenant_id, status")
            .or(`tracking_number.eq.${trackingCode},external_id.eq.${trackingCode}`)
            .single();

        if (existingLead) {
            // Update existing lead with tracking info
            await supabase
                .from("leads")
                .update({
                    status: mappedStatus,
                    tracking_number: trackingCode,
                    delivery_status: statusName,
                    delivery_comment: comment,
                    delivery_date: date,
                    delivery_sub_status: subStatusName,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", existingLead.id);

            console.log(`✅ Updated lead ${existingLead.id} to status: ${mappedStatus}`);
        } else {
            // Get all Aramex connections to find tenant
            const { data: connections } = await supabase
                .from("integration_connections")
                .select("tenant_id")
                .eq("integration_id", (await supabase.from("integrations").select("id").eq("slug", "aramex").single()).data?.id)
                .eq("status", "active");

            // Create a new lead or shipment record
            // You can customize this based on your needs
            for (const conn of connections || []) {
                await supabase.from("leads").insert({
                    tenant_id: conn.tenant_id,
                    customer: "Aramex Shipment",
                    product: `Tracking: ${trackingCode}`,
                    status: mappedStatus,
                    source: "aramex",
                    tracking_number: trackingCode,
                    delivery_status: statusName,
                    delivery_comment: comment,
                    delivery_date: date,
                    delivery_sub_status: subStatusName,
                    external_id: trackingCode,
                    date: date,
                });
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