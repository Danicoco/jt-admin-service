const { jsonS, jsonFailed } = require("../../../utils");
const { listCustomers, getCustomerMetrics, getHoldings, getOrders, getOverview, getTransactions, setUserStatus } = require("../../../services/userService");

const Controller = {
  list: async (req, res) => {
    try {
      const { page, limit, search, verified, active } = req.query;
      const out = await listCustomers({ page, limit, search, verified, active });
      return jsonS(res, 200, "Users fetched", out);
    } catch (e) {
      console.error("admin users.list error:", e?.response?.data || e);
      return jsonFailed(res, {}, "Failed to fetch users", 500);
    }
  },

  metrics: async (req, res) => {
    try {
      const { windowDays } = req.query;
      const out = await getCustomerMetrics({ windowDays });
      return jsonS(res, 200, "Users metrics fetched", out);
    } catch (e) {
      console.error("admin users.metrics error:", e?.response?.data || e);
      return jsonFailed(res, {}, "Failed to fetch users metrics", 500);
    }
  },

  userDetails: async (req, res) => {
    try {
      const { id } = req.params;
      const [overview, holdings] = await Promise.all([ getOverview(id), getHoldings(id)]);
      if (!overview) return jsonFailed(res, {}, "Not found", 404);

      return jsonS(res, 200, "OK", {
        profile:     overview.profile,
        location:    overview.location,
        ordersCount: overview.ordersCount,
      });
    } catch (e) {
      console.error("admin.customers.details error:", e);
      return jsonFailed(res, {}, "Error", 500);
    }
  },

  userOrders: async (req, res) => {
    try {
      const { id } = req.params;
      const { page, limit, status } = req.query;
      const data = await getOrders(id, { page, limit, status });
      return jsonS(res, 200, "OK", data);
    } catch (e) {
      console.error("admin.customers.orders error:", e);
      return jsonFailed(res, {}, "Error", 500);
    }
  },

  userTransactions: async (req, res) => {
    try {
      const { id } = req.params;
      const { page, limit, mode, status } = req.query;
      const data = await getTransactions(id, { page, limit, mode, status });
      return jsonS(res, 200, "OK", data);
    } catch (e) {
      console.error("admin.customers.tx error:", e);
      return jsonFailed(res, {}, "Error", 500);
    }
  },

  updateUserStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const out = await setUserStatus(id, isActive);
      if (!out) return jsonFailed(res, {}, "Failed", 400);
      return jsonS(res, 200, "OK", out);
    } catch (e) {
      console.error("admin.customers.status error:", e);
      return jsonFailed(res, {}, "Error", 500);
    }
  },
};

module.exports = Controller;
