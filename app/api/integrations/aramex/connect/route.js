import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
    try {
        const body = await req.json();
        const { username, password, account_number, account_pin, account_entity, tenant_id, name } = body;

        if (!username || !password || !account_number || !tenant_id) {
            return NextResponse.json(
                { error: "Username, password, account number, and tenant ID are required" },
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
                    credentials: {
                        username,
                        password,
                        account_number,
                        account_pin: account_pin || "",
                        account_entity: account_entity || "",
                    },
                    config: {
                        type: "aramex_api",
                        account_number,
                        account_entity: account_entity || "",
                    },
                })
                .eq("id", existing.id);

            if (error) throw error;

            return NextResponse.json({
                success: true,
                message: "Aramex connection updated",
                id: existing.id,
            });
        }

        // Create new connection
        const { data, error } = await supabase
            .from("integration_connections")
            .insert({
                tenant_id,
                integration_id: integration.id,
                name: name || "Aramex Connection",
                status: "active",
                credentials: {
                    username,
                    password,
                    account_number,
                    account_pin: account_pin || "",
                    account_entity: account_entity || "",
                },
                config: {
                    type: "aramex_api",
                    account_number,
                    account_entity: account_entity || "",
                },
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: "Aramex connected successfully",
            id: data.id,
        });
    } catch (err) {
        console.error("Aramex connect error:", err);
        return NextResponse.json(
            { error: err.message || "Failed to connect Aramex" },
            { status: 500 }
        );
    }
}