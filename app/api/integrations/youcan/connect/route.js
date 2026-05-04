import { NextResponse } from "next/server";

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenant_id");
    const state = searchParams.get("state");

    const clientId = process.env.YOUCAN_CLIENT_ID;
    const redirectUri = process.env.YOUCAN_REDIRECT_URI;

    if (!clientId || !redirectUri) {
        return NextResponse.json(
            { error: "Missing YouCan env variables" },
            { status: 500 }
        );
    }

    // Pass tenant_id through state so callback knows who connected
    const stateData = Buffer.from(JSON.stringify({ tenant_id: tenantId })).toString("base64");

    const scope = "orders.read products.read";

    const url =
        `https://api.youcan.shop/oauth/authorize` +
        `?client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=${scope}` +
        `&state=${stateData}`;

    return NextResponse.redirect(url);
}