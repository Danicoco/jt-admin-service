const { jsonS, jsonFailed } = require("../../../utils");
const {
  listCustomers,
  getCustomerMetrics,
  getHoldings,
  getOrders,
  getOverview,
  getTransactions,
  setUserStatus,
  getRiskSignals,
  setRiskOverride,
} = require("../../../services/userService");
const { assessRisk, RISK_LEVELS } = require("../../../services/riskService");

const Controller = {
  list: async (req, res) => {
    try {
      const { page, limit, search, verified, active } = req.query;
      const out = await listCustomers({
        page,
        limit,
        search,
        verified,
        active,
      });
      const customers = out.customers || [];
      const signals = await getRiskSignals(customers.map((c) => c._id));
      out.customers = customers.map((c) => ({
        ...c,
        risk: assessRisk(c, signals[c._id]),
      }));
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
      const [overview, holdings, signals] = await Promise.all([
        getOverview(id),
        getHoldings(id),
        getRiskSignals([id]),
      ]);
      if (!overview) return jsonFailed(res, {}, "Not found", 404);

      return jsonS(res, 200, "OK", {
        profile: overview.profile,
        location: overview.location,
        ordersCount: overview.ordersCount,
        holdings,
        activity: signals[id] || null,
        risk: assessRisk(overview.profile, signals[id]),
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

Controller.updateUserRisk = async (req, res) => {
  try {
    const { id } = req.params;
    const { level, note } = req.body;
    if (level !== "auto" && !RISK_LEVELS.includes(level)) {
      return jsonFailed(res, {}, "level must be low, medium, high or auto", 400);
    }
    const out = await setRiskOverride(id, {
      level,
      note,
      setBy: req.user?.email || req.user?.id,
    });
    return jsonS(res, 200, "Risk level updated", out);
  } catch (e) {
    console.error("admin.customers.risk error:", e?.response?.data || e);
    const status = e?.response?.status === 404 ? 404 : 500;
    return jsonFailed(res, {}, status === 404 ? "Not found" : "Error", status);
  }
};

module.exports = Controller;
