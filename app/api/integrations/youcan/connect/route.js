import { NextResponse } from "next/server";

export async function GET() {
    const clientId = process.env.YOUCAN_CLIENT_ID;
    const redirectUri = process.env.YOUCAN_REDIRECT_URI;

    if (!clientId || !redirectUri) {
        return NextResponse.json(
            { error: "Missing YouCan env variables" },
            { status: 500 }
        );
    }

    const scope = "orders.read products.read";

    const url =
        `https://api.youcan.shop/oauth/authorize` +
        `?client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=${scope}`;

    return NextResponse.redirect(url);
}