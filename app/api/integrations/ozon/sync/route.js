import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
    try {
        const { connection_id } = await req.json();
        if (!connection_id) return NextResponse.json({ error: "Missing connection_id" }, { status: 400 });

        const { data: connection } = await supabase
            .from("integration_connections")
            .select("*")
            .eq("id", connection_id)
            .single();

        if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

        const { client_id, api_key, api_url } = connection.credentials;
        const baseUrl = api_url || "https://api.ozonexpress.ma";

        // Fetch cities list
        const citiesRes = await fetch(`${baseUrl}/cities`);
        const cities = await citiesRes.json();

        // You can also fetch parcels if the API supports it
        // This depends on Ozon Express API capabilities

        return NextResponse.json({ 
            success: true, 
            message: "Ozon Express sync completed",
            cities_available: Object.keys(cities).length 
        });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}