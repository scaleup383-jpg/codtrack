import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 🔐 Verify YouCan signature
function isValidSignature(payload, signature, secret) {
    const expected = crypto
        .createHmac("sha256", secret)
        .update(JSON.stringify(payload))
        .digest("hex");

    return crypto.timingSafeEqual(
        Buffer.from(expected),
        Buffer.from(signature || "")
    );
}

export async function POST(req) {
    try {
        const signature = req.headers.get("x-youcan-signature");

        const body = await req.json();

        // 🔐 IMPORTANT: OAuth client secret from YouCan
        const secret = process.env.YOUCAN_CLIENT_SECRET;

        // ❌ reject if invalid
        if (!isValidSignature(body, signature, secret)) {
            return new Response("Invalid signature", { status: 401 });
        }

        console.log("VALID YOUCAN ORDER:", body);

        // 📦 map order
        const order = {
            customer: body?.customer?.name || "Unknown",
            phone: body?.customer?.phone || null,
            city: body?.shipping?.city || null,
            product: body?.items?.[0]?.name || null,
            quantity: body?.items?.length || 1,
            amount: body?.total || 0,
            status: "pending",
            tracking: body?.tracking_number || null,
            date: new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from("leads")
            .insert([order])
            .select();

        if (error) {
            console.error(error);
            return Response.json({ success: false }, { status: 500 });
        }

        return Response.json({
            success: true,
            inserted: data,
        });

    } catch (err) {
        console.error("WEBHOOK ERROR:", err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}