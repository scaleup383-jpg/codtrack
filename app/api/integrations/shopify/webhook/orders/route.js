import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
    try {
        const body = await req.json();
        const shop = req.headers.get("x-shopify-shop-domain");

        // Find the connection for this shop
        const { data: connection } = await supabase
            .from("integration_connections")
            .select("tenant_id, integration_id")
            .eq("credentials->>shop", shop)
            .single();

        if (!connection) {
            return new Response("Connection not found", { status: 404 });
        }

        const order = body;

        await supabase.from("leads").insert({
            tenant_id: connection.tenant_id,
            customer: `${order.customer?.first_name || ""} ${order.customer?.last_name || ""}`.trim() || "Unknown",
            phone: order.phone || order.shipping_address?.phone || "",
            city: order.shipping_address?.city || "",
            product: order.line_items?.map(item => item.name).join(", ") || "",
            amount: parseFloat(order.total_price) || 0,
            status: "pending",
            source: "shopify",
            external_id: String(order.id),
            date: new Date().toISOString(),
        });

        return new Response("ok", { status: 200 });
    } catch (err) {
        console.error("Shopify webhook error:", err);
        return new Response("error", { status: 500 });
    }
}