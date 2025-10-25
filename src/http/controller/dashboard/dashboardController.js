const { jsonS, jsonFailed } = require("../../../utils");
const {
  getSummary,
  getLatestOrders,
  getTopProducts
} = require("../../../services/dashboardService");

const Controller = {
  summary: async (req, res) => {
    try {
      const data = await getSummary();
      return jsonS(res, 200, "Dashboard summary", data);
    } catch (err) {
      console.error("dashboard.summary error:", err);
      return jsonFailed(res, {}, "Failed to fetch dashboard summary", 500);
    }
  },

  latestOrders: async (req, res) => {
    try {
      const limit = Number(req.query.limit) || 6;
      const rows  = await getLatestOrders({ limit });
      return jsonS(res, 200, "Latest orders", rows);
    } catch (err) {
      console.error("dashboard.latestOrders error:", err);
      return jsonFailed(res, {}, "Failed to fetch latest orders", 500);
    }
  },

  topProducts: async (req, res) => {
    try {
      const limit = Number(req.query.limit) || 3;
      const rows  = await getTopProducts({ limit });
      return jsonS(res, 200, "Top products", rows);
    } catch (err) {
      console.error("dashboard.topProducts error:", err);
      return jsonFailed(res, {}, "Failed to fetch top products", 500);
    }
  },
};

module.exports = Controller;
