export class IntegrationAdapter {
  async connect(credentials) {
    throw new Error("connect() not implemented");
  }

  async getProducts(connection) {
    throw new Error("getProducts() not implemented");
  }

  async getOrders(connection) {
    throw new Error("getOrders() not implemented");
  }

  async createShipment(order, connection) {
    throw new Error("createShipment() not implemented");
  }
}