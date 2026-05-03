import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req) {
    const url = new URL(req.url);
    const shop = url.searchParams.get("shop");
    const code = url.searchParams.get("code");

    if (!shop || !code) {
        return Response.json({ error: "Missing params" }, { status: 400 });
    }

    // exchange code for access token
    const tokenRes = await fetch(
        `https://${shop}/admin/oauth/access_token`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                client_id: process.env.SHOPIFY_CLIENT_ID,
                client_secret: process.env.SHOPIFY_CLIENT_SECRET,
                code,
            }),
        }
    );

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
        return Response.json({ error: "Token error" }, { status: 500 });
    }

    // store connection
    await supabase.from("integration_connections").insert({
        tenant_id: "TEMP", // replace with real tenant logic
        provider: "shopify",
        status: "active",
        credentials: {
            shop,
            access_token: tokenData.access_token,
        },
        config: {},
    });

    return Response.redirect("http://localhost:3000/integrations");
}