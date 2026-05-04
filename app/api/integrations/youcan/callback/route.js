import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code) {
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/integrations?error=missing_code`
        );
    }

    try {
        // Exchange code for access token
        const tokenRes = await fetch("https://api.youcan.shop/oauth/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                client_id: process.env.YOUCAN_CLIENT_ID,
                client_secret: process.env.YOUCAN_CLIENT_SECRET,
                code,
                grant_type: "authorization_code",
                redirect_uri: process.env.YOUCAN_REDIRECT_URI,
            }),
        });

        const tokenData = await tokenRes.json();

        if (!tokenData.access_token) {
            console.error("Token error:", tokenData);
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/integrations?error=token_error`
            );
        }

        // Parse state to get tenant_id
        let tenantId = null;
        try {
            const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
            tenantId = stateData.tenant_id;
        } catch {
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/integrations?error=invalid_state`
            );
        }

        if (!tenantId) {
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/integrations?error=no_tenant`
            );
        }

        // Get YouCan integration ID
        const { data: integration } = await supabase
            .from("integrations")
            .select("id")
            .eq("slug", "youcan")
            .single();

        if (!integration) {
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/integrations?error=integration_not_found`
            );
        }

        // Get store info using access token
        const storeRes = await fetch("https://api.youcan.shop/store", {
            headers: {
                "Authorization": `Bearer ${tokenData.access_token}`,
                "Content-Type": "application/json",
            },
        });

        const storeData = await storeRes.json();
        const storeUrl = storeData?.url || "";

        // Check if connection already exists
        const { data: existing } = await supabase
            .from("integration_connections")
            .select("id")
            .eq("integration_id", integration.id)
            .eq("tenant_id", tenantId)
            .single();

        if (existing) {
            // Update existing
            await supabase
                .from("integration_connections")
                .update({
                    status: "active",
                    credentials: {
                        access_token: tokenData.access_token,
                        refresh_token: tokenData.refresh_token,
                        expires_at: tokenData.expires_at,
                    },
                    config: {
                        store_url: storeUrl,
                        type: "youcan_oauth",
                    },
                })
                .eq("id", existing.id);
        } else {
            // Create new
            await supabase
                .from("integration_connections")
                .insert({
                    tenant_id: tenantId,
                    integration_id: integration.id,
                    status: "active",
                    credentials: {
                        access_token: tokenData.access_token,
                        refresh_token: tokenData.refresh_token,
                        expires_at: tokenData.expires_at,
                    },
                    config: {
                        store_url: storeUrl,
                        type: "youcan_oauth",
                    },
                });
        }

        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/integrations?success=youcan_connected`
        );
    } catch (err) {
        console.error("YouCan callback error:", err);
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/integrations?error=server_error`
        );
    }
}