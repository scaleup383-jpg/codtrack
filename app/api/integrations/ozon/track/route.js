import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
    try {
        const body = await req.json();
        const { connection_id, tracking_numbers } = body;

        if (!connection_id || !tracking_numbers) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const { data: connection } = await supabase
            .from("integration_connections")
            .select("*")
            .eq("id", connection_id)
            .single();

        if (!connection) {
            return NextResponse.json({ error: "Connection not found" }, { status: 404 });
        }

        const { client_id, api_key, api_url } = connection.credentials;
        const baseUrl = api_url || "https://api.ozonexpress.ma";

        // Handle single or multiple tracking numbers
        const numbers = Array.isArray(tracking_numbers) ? tracking_numbers : [tracking_numbers];

        // Use JSON format for bulk tracking
        const ozonRes = await fetch(`${baseUrl}/customers/${client_id}/${api_key}/tracking`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ "tracking-number": numbers }),
        });

        const trackingData = await ozonRes.json();

        if (!ozonRes.ok) {
            return NextResponse.json({ success: false, error: "Failed to fetch tracking" }, { status: 400 });
        }

        // Update leads with tracking info
        let updated = 0;
        const results = Array.isArray(trackingData) ? trackingData : [trackingData];

        for (const track of results) {
            const trackingNumber = track["TRACKING-NUMBER"] || track.tracking_number;
            if (!trackingNumber) continue;

            const { data: lead } = await supabase
                .from("leads")
                .select("id")
                .eq("tracking_number", trackingNumber)
                .eq("tenant_id", connection.tenant_id)
                .single();

            if (lead) {
                await supabase.from("leads").update({
                    delivery_status: mapOzonTrackingStatus(track),
                    delivery_date: track.date || new Date().toISOString(),
                    delivery_comment: track.status_label || track.message || "",
                }).eq("id", lead.id);
                updated++;
            }
        }

        return NextResponse.json({
            success: true,
            updated,
            total: results.length,
            data: trackingData,
        });
    } catch (err) {
        console.error("Ozon track error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

function mapOzonTrackingStatus(track) {
    const status = (track.status || track.STATUS || "").toLowerCase();
    const mapping = {
        "delivered": "delivered", "livré": "delivered",
        "in_transit": "in_transit", "en_cours": "in_transit",
        "pending": "pending", "en_attente": "pending",
        "cancelled": "cancelled", "annulé": "cancelled",
        "returned": "returned", "retourné": "returned",
        "out_for_delivery": "out_for_delivery", "en_livraison": "out_for_delivery",
    };
    return mapping[status] || "in_transit";
}