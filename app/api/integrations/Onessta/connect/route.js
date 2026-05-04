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

        // Get Onessta integration ID
        const { data: integration } = await supabase
            .from("integrations")
            .select("id")
            .eq("slug", "onessta")
            .single();

        if (!integration) {
            return NextResponse.json(
                { error: "Onessta integration not found" },
                { status: 404 }
            );
        }

        // Check if connection already exists for this tenant with same name
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
                    credentials: { api_key, client_id },
                    config: { type: "onessta_api" },
                })
                .eq("id", existing.id);

            if (error) throw error;

            return NextResponse.json({
                success: true,
                message: "Onessta connection updated",
                id: existing.id,
            });
        }

        // Create new connection
        const { data, error } = await supabase
            .from("integration_connections")
            .insert({
                tenant_id,
                integration_id: integration.id,
                name: name || "Onessta Connection",
                status: "active",
                credentials: { api_key, client_id },
                config: { type: "onessta_api" },
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: "Onessta connected successfully",
            id: data.id,
        });
    } catch (err) {
        console.error("Onessta connect error:", err);
        return NextResponse.json(
            { error: err.message || "Failed to connect Onessta" },
            { status: 500 }
        );
    }
}