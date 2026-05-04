import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req) {
    const url = new URL(req.url);
    const shop = url.searchParams.get("shop");
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state"); // We'll pass tenant_id as state

    if (!shop || !code) {
        return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/integrations?error=missing_params`);
    }

    try {
        // Exchange code for access token
        const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                client_id: process.env.SHOPIFY_CLIENT_ID,
                client_secret: process.env.SHOPIFY_CLIENT_SECRET,
                code,
            }),
        });

        const tokenData = await tokenRes.json();

        if (!tokenData.access_token) {
            return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/integrations?error=token_error`);
        }

        // Get the Shopify integration ID from integrations table
        const { data: integration } = await supabase
            .from("integrations")
            .select("id")
            .eq("slug", "shopify")
            .single();

        if (!integration) {
            return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/integrations?error=integration_not_found`);
        }

        // Parse state to get tenant_id (passed from frontend)
        let tenantId = null;
        try {
            const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
            tenantId = stateData.tenant_id;
        } catch {
            // If no state, try to find tenant by shop
            const { data: existingConn } = await supabase
                .from("integration_connections")
                .select("tenant_id")
                .eq("credentials->>shop", shop)
                .single();
            tenantId = existingConn?.tenant_id;
        }

        if (!tenantId) {
            return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/integrations?error=no_tenant`);
        }

        // Check if connection already exists
        const { data: existingConnection } = await supabase
            .from("integration_connections")
            .select("id")
            .eq("integration_id", integration.id)
            .eq("tenant_id", tenantId)
            .single();

        if (existingConnection) {
            // Update existing connection
            await supabase
                .from("integration_connections")
                .update({
                    status: "active",
                    credentials: { shop, access_token: tokenData.access_token },
                    config: { shop_url: shop },
                })
                .eq("id", existingConnection.id);
        } else {
            // Create new connection
            await supabase
                .from("integration_connections")
                .insert({
                    tenant_id: tenantId,
                    integration_id: integration.id,
                    status: "active",
                    credentials: { shop, access_token: tokenData.access_token },
                    config: { shop_url: shop, type: "shopify" },
                });
        }

        return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/integrations?success=shopify_connected`);
    } catch (err) {
        console.error("Shopify callback error:", err);
        return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/integrations?error=server_error`);
    }
}