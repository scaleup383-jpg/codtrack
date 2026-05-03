export default class WooCommerceAdapter {
  getAuthHeader(consumer_key, consumer_secret) {
    const token = Buffer.from(
      `${consumer_key}:${consumer_secret}`
    ).toString("base64");

    return `Basic ${token}`;
  }

  async getProducts(connection) {
    const { url, consumer_key, consumer_secret } = connection.credentials;

    const res = await fetch(`${url}/wp-json/wc/v3/products`, {
      headers: {
        Authorization: this.getAuthHeader(consumer_key, consumer_secret),
      },
    });

    const data = await res.json();

    return data.map((p) => ({
      external_id: p.id,
      name: p.name,
      price: parseFloat(p.price),
    }));
  }

  async getOrders(connection) {
    const { url, consumer_key, consumer_secret } = connection.credentials;

    const res = await fetch(`${url}/wp-json/wc/v3/orders`, {
      headers: {
        Authorization: this.getAuthHeader(consumer_key, consumer_secret),
      },
    });

    const data = await res.json();

    return data.map((o) => ({
      external_id: o.id,
      customer: o.billing?.first_name,
      total: parseFloat(o.total),
      status: o.status,
    }));
  }
}