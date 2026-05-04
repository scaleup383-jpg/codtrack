import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
        const secret = process.env.YOUCAN_CLIENT_SECRET;

        if (!isValidSignature(body, signature, secret)) {
            return new Response("Invalid signature", { status: 401 });
        }

        // Find tenant by store URL from the webhook
        const storeUrl = body?.store_url || "";
        const { data: connection } = await supabase
            .from("integration_connections")
            .select("tenant_id")
            .eq("config->>store_url", storeUrl)
            .single();

        const order = {
            tenant_id: connection?.tenant_id || null,
            customer: body?.customer?.name || "Unknown",
            phone: body?.customer?.phone || null,
            city: body?.shipping?.city || null,
            product: body?.items?.map(i => i.name).join(", ") || null,
            quantity: body?.items?.length || 1,
            amount: body?.total || 0,
            status: "pending",
            source: "youcan",
            external_id: String(body?.id || ""),
            date: new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from("leads")
            .insert([order])
            .select();

        if (error) {
            console.error("Insert error:", error);
            return Response.json({ success: false }, { status: 500 });
        }

        return Response.json({ success: true, inserted: data });
    } catch (err) {
        console.error("WEBHOOK ERROR:", err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}