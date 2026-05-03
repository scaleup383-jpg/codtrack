import { IntegrationAdapter } from "../core/types";

export default class ShopifyAdapter extends IntegrationAdapter {
  async getProducts(connection) {
    const { shop, access_token } = connection.credentials;

    const res = await fetch(
      `https://${shop}.myshopify.com/admin/api/2024-01/products.json`,
      {
        headers: {
          "X-Shopify-Access-Token": access_token,
        },
      }
    );

    const data = await res.json();

    return data.products.map(p => ({
      external_id: p.id,
      name: p.title,
      price: p.variants[0]?.price || 0,
    }));
  }

  async getOrders(connection) {
    const { shop, access_token } = connection.credentials;

    const res = await fetch(
      `https://${shop}.myshopify.com/admin/api/2024-01/orders.json`,
      {
        headers: {
          "X-Shopify-Access-Token": access_token,
        },
      }
    );

    const data = await res.json();

    return data.orders.map(o => ({
      external_id: o.id,
      customer: o.customer?.first_name,
      total: o.total_price,
    }));
  }
}