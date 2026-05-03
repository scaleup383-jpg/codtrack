export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get("shop");

    if (!shop) {
        return Response.json(
            { error: "Missing shop parameter (e.g. my-store.myshopify.com)" },
            { status: 400 }
        );
    }

    const clientId = process.env.SHOPIFY_CLIENT_ID;
    const redirectUri = process.env.SHOPIFY_REDIRECT_URI;
    const scopes = process.env.SHOPIFY_SCOPES;

    const installUrl =
        `https://${shop}/admin/oauth/authorize?` +
        `client_id=${clientId}` +
        `&scope=${scopes}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}`;

    return Response.redirect(installUrl);
}