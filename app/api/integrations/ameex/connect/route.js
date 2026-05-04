import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
    try {
        const body = await req.json();
        const { api_key, tenant_id } = body;

        if (!api_key || !tenant_id) {
            return NextResponse.json(
                { error: "API key and tenant ID are required" },
                { status: 400 }
            );
        }

        // Get Aramex integration ID
        const { data: integration } = await supabase
            .from("integrations")
            .select("id")
            .eq("slug", "aramex")
            .single();

        if (!integration) {
            return NextResponse.json(
                { error: "Aramex integration not found" },
                { status: 404 }
            );
        }

        // Verify the API key by making a test request
        // (Aramex doesn't have a test endpoint, so we just store it)

        // Check if connection already exists
        const { data: existing } = await supabase
            .from("integration_connections")
            .select("id")
            .eq("integration_id", integration.id)
            .eq("tenant_id", tenant_id)
            .single();

        if (existing) {
            // Update existing connection
            const { error } = await supabase
                .from("integration_connections")
                .update({
                    status: "active",
                    credentials: { api_key },
                    config: { type: "aramex_api", webhook_ready: true },
                })
                .eq("id", existing.id);

            if (error) throw error;
        } else {
            // Create new connection
            const { error } = await supabase
                .from("integration_connections")
                .insert({
                    tenant_id: tenant_id,
                    integration_id: integration.id,
                    status: "active",
                    credentials: { api_key },
                    config: { type: "aramex_api", webhook_ready: true },
                });

            if (error) throw error;
        }

        return NextResponse.json({
            success: true,
            message: "Aramex connected successfully",
        });
    } catch (err) {
        console.error("Aramex connect error:", err);
        return NextResponse.json(
            { error: err.message || "Failed to connect Aramex" },
            { status: 500 }
        );
    }
}