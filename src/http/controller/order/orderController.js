const { jsonS, jsonFailed } = require("../../../utils");
const svc = require("../../../services/orderService");

const Controller = {
  orderSummary: async (req, res) => {
    try {
      const cards = await svc.getSummary();
      return jsonS(res, 200, 'Orders summary', cards);
    } catch (e) {
      console.error('admin.orders.summary error:', e);
      return jsonFailed(res, {}, 'Failed to fetch orders summary', 500);
    }
  },

  orderChart: async (req, res) => {
    try {
      const data = await svc.getChart({ months: req.query.months });
      return jsonS(res, 200, 'Orders chart', data);
    } catch (e) {
      console.error('admin.orders.chart error:', e);
      return jsonFailed(res, {}, 'Failed to fetch orders chart', 500);
    }
  },

  orderList: async (req, res) => {
    try {
      const data = await svc.listOrders(req.query);
      return jsonS(res, 200, 'Orders fetched', data);
    } catch (e) {
      console.error('admin.orders.list error:', e);
      return jsonFailed(res, {}, 'Failed to fetch orders', 500);
    }
  },

  topCategories: async (req, res) => {
    try {
      const limit = Number(req.query.limit) || 4;
      const data = await svc.getTopCategories({ limit });
      return jsonS(res, 200, 'Top categories', data);
    } catch (e) {
      console.error('admin.orders.topCategories error:', e);
      return jsonFailed(res, {}, 'Failed to fetch top categories', 500);
    }
  },

  getOrderById: async (req, res) => {
    try {
      const { id } = req.params;
      const data = await svc.getOrderDetails(id);
      if (!data) return jsonFailed(res, {}, "Order not found", 404);
      return jsonS(res, 200, "Order details", data);
    } catch (e) {
      console.error("admin getOrderDetails error:", e);
      return jsonFailed(res, {}, "Failed to fetch order details", 500);
    }
  },
};

module.exports = Controller;
