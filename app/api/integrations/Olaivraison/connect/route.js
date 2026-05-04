import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
    try {
        const body = await req.json();
        const { api_key, client_id, api_url, tenant_id, name } = body;

        if (!api_key || !client_id || !tenant_id) {
            return NextResponse.json(
                { error: "API key, Client ID, and tenant ID are required" },
                { status: 400 }
            );
        }

        // Get Olaivraison integration ID
        const { data: integration } = await supabase
            .from("integrations")
            .select("id")
            .eq("slug", "olaivraison")
            .single();

        if (!integration) {
            return NextResponse.json(
                { error: "Olaivraison integration not found" },
                { status: 404 }
            );
        }

        // Default API URL if not provided
        const baseUrl = api_url || "https://api.olaivraison.com";

        // Verify credentials by making a test request
        try {
            const testRes = await fetch(`${baseUrl}/v1/account`, {
                headers: {
                    "Authorization": `Bearer ${api_key}`,
                    "X-Client-ID": client_id,
                    "Content-Type": "application/json",
                },
            });

            if (!testRes.ok) {
                return NextResponse.json(
                    { error: "Invalid credentials. Please check your API key and Client ID." },
                    { status: 401 }
                );
            }
        } catch (fetchErr) {
            // If the test endpoint doesn't exist, still allow connection
            console.warn("Could not verify Olaivraison credentials:", fetchErr.message);
        }

        // Check if connection already exists
        const { data: existing } = await supabase
            .from("integration_connections")
            .select("id")
            .eq("integration_id", integration.id)
            .eq("tenant_id", tenant_id)
            .eq("name", name)
            .single();

        if (existing) {
            // Update existing
            const { error } = await supabase
                .from("integration_connections")
                .update({
                    status: "active",
                    credentials: { api_key, client_id, api_url: baseUrl },
                    config: { type: "olaivraison_api", api_url: baseUrl },
                })
                .eq("id", existing.id);

            if (error) throw error;

            return NextResponse.json({
                success: true,
                message: "Olaivraison connection updated",
                id: existing.id,
            });
        }

        // Create new connection
        const { data, error } = await supabase
            .from("integration_connections")
            .insert({
                tenant_id,
                integration_id: integration.id,
                name: name || "Olaivraison Connection",
                status: "active",
                credentials: { api_key, client_id, api_url: baseUrl },
                config: { type: "olaivraison_api", api_url: baseUrl },
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: "Olaivraison connected successfully",
            id: data.id,
        });
    } catch (err) {
        console.error("Olaivraison connect error:", err);
        return NextResponse.json(
            { error: err.message || "Failed to connect Olaivraison" },
            { status: 500 }
        );
    }
}