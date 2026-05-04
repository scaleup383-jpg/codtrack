import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
    try {
        const body = await req.json();
        const { connection_id, tracking_number } = body;

        if (!connection_id || !tracking_number) {
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

        const formData = new FormData();
        formData.append("tracking-number", tracking_number);

        const ozonRes = await fetch(`${baseUrl}/customers/${client_id}/${api_key}/parcel-info`, {
            method: "POST",
            body: formData,
        });

        const parcelData = await ozonRes.json();

        if (!ozonRes.ok) {
            return NextResponse.json({ success: false, error: "Failed to fetch parcel info" }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            data: parcelData,
        });
    } catch (err) {
        console.error("Ozon parcel info error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}