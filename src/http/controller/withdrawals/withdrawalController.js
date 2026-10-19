const { jsonS, jsonFailed } = require("../../../utils");
const {
  listWithdrawals,
  getWithdrawalSummary,
  batchUsers,
} = require("../../../services/userService");

function pickCustomer(id, embedded, looked) {
  const u = looked || embedded || {};
  return {
    id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    phoneNumber: u.phoneNumber,
  };
}

const Controller = {
  list: async (req, res) => {
    try {
      const { page, limit, kind, status, search, userId, from, to } = req.query;
      const out = await listWithdrawals({ page, limit, kind, status, search, userId, from, to });

      // transactions don't always carry an embedded user snapshot; look those up
      const missing = out.withdrawals
        .filter((w) => !w.user?.email)
        .map((w) => w.sender);
      const users = await batchUsers([...new Set(missing)]);

      out.withdrawals = out.withdrawals.map((w) => ({
        ...w,
        customer: pickCustomer(w.sender, w.user, users[w.sender]),
      }));
      return jsonS(res, 200, "Withdrawals fetched", out);
    } catch (e) {
      console.error("admin.withdrawals.list error:", e?.response?.data || e);
      return jsonFailed(res, {}, "Failed to fetch withdrawals", 500);
    }
  },

  summary: async (req, res) => {
    try {
      const out = await getWithdrawalSummary();
      return jsonS(res, 200, "Withdrawal summary fetched", out);
    } catch (e) {
      console.error("admin.withdrawals.summary error:", e?.response?.data || e);
      return jsonFailed(res, {}, "Failed to fetch withdrawal summary", 500);
    }
  },
};

module.exports = Controller;
