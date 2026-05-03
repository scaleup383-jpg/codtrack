import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
    const body = await req.json();

    const order = body;

    await supabase.from("leads").insert({
        customer: order.customer?.first_name || "unknown",
        phone: order.phone,
        city: order.shipping_address?.city,
        product: order.line_items?.[0]?.name,
        amount: order.total_price,
        status: order.financial_status,
        source: "shopify",
        external_id: order.id,
        date: new Date().toISOString(),
    });

    return new Response("ok");
}