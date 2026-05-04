import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
    try {
        const body = await req.json();
        console.log("📦 Ozon Express webhook:", body);

        const trackingNumber = body["TRACKING-NUMBER"] || body.tracking_number;
        const status = body.STATUS || body.status;

        if (!trackingNumber) {
            return NextResponse.json({ error: "Missing tracking number" }, { status: 400 });
        }

        const deliveryStatus = mapOzonStatus(status);

        // Find and update lead
        const { data: lead } = await supabase
            .from("leads")
            .select("id, tenant_id")
            .eq("tracking_number", trackingNumber)
            .single();

        if (lead) {
            await supabase.from("leads").update({
                delivery_status: deliveryStatus,
                delivery_date: new Date().toISOString(),
                delivery_comment: body.message || body.MESSAGE || "",
            }).eq("id", lead.id);

            // Auto-update confirmation status if delivered
            if (deliveryStatus === "delivered") {
                await supabase.from("leads").update({
                    status: "delivered",
                    delivered_at: new Date().toISOString(),
                }).eq("id", lead.id);
            }
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Ozon webhook error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

function mapOzonStatus(status) {
    const mapping = {
        "delivered": "delivered", "livré": "delivered",
        "in_transit": "in_transit", "en_cours": "in_transit",
        "pending": "pending", "en_attente": "pending",
        "cancelled": "cancelled", "annulé": "cancelled",
        "returned": "returned", "retourné": "returned",
        "out_for_delivery": "out_for_delivery", "en_livraison": "out_for_delivery",
    };
    return mapping[status?.toLowerCase()] || "in_transit";
}