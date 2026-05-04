import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
    try {
        const body = await req.json();
        const { api_key, client_id, tenant_id, name } = body;

        if (!api_key || !client_id || !tenant_id) {
            return NextResponse.json(
                { error: "API key, Client ID, and tenant ID are required" },
                { status: 400 }
            );
        }

        // Get Ozon integration ID
        const { data: integration } = await supabase
            .from("integrations")
            .select("id")
            .eq("slug", "ozon")
            .single();

        if (!integration) {
            return NextResponse.json(
                { error: "Ozon integration not found" },
                { status: 404 }
            );
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
            const { error } = await supabase
                .from("integration_connections")
                .update({
                    status: "active",
                    credentials: { api_key, client_id },
                    config: { type: "ozon_api" },
                })
                .eq("id", existing.id);

            if (error) throw error;

            return NextResponse.json({
                success: true,
                message: "Ozon connection updated",
                id: existing.id,
            });
        }

        // Create new connection
        const { data, error } = await supabase
            .from("integration_connections")
            .insert({
                tenant_id,
                integration_id: integration.id,
                name: name || "Ozon Connection",
                status: "active",
                credentials: { api_key, client_id },
                config: { type: "ozon_api" },
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: "Ozon connected successfully",
            id: data.id,
        });
    } catch (err) {
        console.error("Ozon connect error:", err);
        return NextResponse.json(
            { error: err.message || "Failed to connect Ozon" },
            { status: 500 }
        );
    }
}