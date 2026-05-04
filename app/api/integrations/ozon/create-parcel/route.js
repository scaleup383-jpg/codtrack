import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
    try {
        const body = await req.json();
        const { connection_id, lead_id, parcel_data } = body;

        if (!connection_id || !parcel_data) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Get connection credentials
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

        // Create form data for Ozon API
        const formData = new FormData();
        if (parcel_data.tracking_number) formData.append("tracking-number", parcel_data.tracking_number);
        formData.append("parcel-receiver", parcel_data.receiver || "Unknown");
        formData.append("parcel-phone", parcel_data.phone || "");
        formData.append("parcel-city", parcel_data.city_id || "1");
        formData.append("parcel-address", parcel_data.address || "");
        formData.append("parcel-price", parcel_data.price || "0");
        formData.append("parcel-stock", parcel_data.stock || "1");
        if (parcel_data.note) formData.append("parcel-note", parcel_data.note);
        if (parcel_data.nature) formData.append("parcel-nature", parcel_data.nature);
        if (parcel_data.open) formData.append("parcel-open", parcel_data.open);
        if (parcel_data.fragile) formData.append("parcel-fragile", parcel_data.fragile);
        if (parcel_data.replace) formData.append("parcel-replace", parcel_data.replace);
        if (parcel_data.products) formData.append("products", JSON.stringify(parcel_data.products));

        // Call Ozon API
        const ozonRes = await fetch(`${baseUrl}/customers/${client_id}/${api_key}/add-parcel`, {
            method: "POST",
            body: formData,
        });

        const ozonData = await ozonRes.json();

        if (!ozonRes.ok) {
            return NextResponse.json({ success: false, error: ozonData.MESSAGE || "Failed to create parcel" }, { status: 400 });
        }

        const trackingNumber = ozonData["TRACKING-NUMBER"];

        // Update lead with tracking info
        if (lead_id && trackingNumber) {
            await supabase.from("leads").update({
                tracking_number: trackingNumber,
                delivery_company: "Ozon Express",
                shipping_source: "ozon",
                delivery_status: "shipped",
                status: "shipped",
            }).eq("id", lead_id);
        }

        return NextResponse.json({
            success: true,
            tracking_number: trackingNumber,
            data: ozonData,
        });
    } catch (err) {
        console.error("Ozon create parcel error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}