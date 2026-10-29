const { jsonS, jsonFailed } = require("../../../utils");
const svc = require("../../../services/bvnWatchlistService");

const MAX_CSV_BYTES = 2 * 1024 * 1024;
const adminId = (req) => req.user?.email || req.user?.id;

const Controller = {
  list: async (req, res) => {
    try {
      const { page, limit, search, onSystem } = req.query;
      const out = await svc.list({ page, limit, search, onSystem });
      return jsonS(res, 200, "Watchlist fetched", out);
    } catch (e) {
      console.error("bvnWatchlist.list error:", e);
      return jsonFailed(res, {}, "Failed to fetch watchlist", 500);
    }
  },

  summary: async (_req, res) => {
    try {
      return jsonS(res, 200, "Watchlist summary", await svc.summary());
    } catch (e) {
      console.error("bvnWatchlist.summary error:", e);
      return jsonFailed(res, {}, "Failed to fetch watchlist summary", 500);
    }
  },

  add: async (req, res) => {
    try {
      const { entry, flagged, error, status } = await svc.addOne(req.body, adminId(req));
      if (error) return jsonFailed(res, {}, error, status);
      const msg = flagged
        ? `BVN added. ${flagged} matching account${flagged === 1 ? " was" : "s were"} flagged and deactivated.`
        : "BVN added to the watchlist";
      return jsonS(res, 201, msg, { entry, flaggedAccounts: flagged });
    } catch (e) {
      console.error("bvnWatchlist.add error:", e?.response?.data || e);
      return jsonFailed(res, {}, "Failed to add BVN", 500);
    }
  },

  upload: async (req, res) => {
    const file = req.files?.file;
    if (!file) return jsonFailed(res, {}, "Upload a CSV file in the `file` field", 400);
    if (Array.isArray(file)) return jsonFailed(res, {}, "Upload one CSV file at a time", 400);
    if (file.size > MAX_CSV_BYTES) return jsonFailed(res, {}, "CSV must be 2MB or smaller", 400);
    if (!/\.csv$/i.test(file.name || "")) return jsonFailed(res, {}, "File must be a .csv", 400);

    try {
      const out = await svc.addFromCsv(file.data.toString("utf8"), adminId(req));
      if (out.error) return jsonFailed(res, {}, out.error, out.status);
      return jsonS(res, 201, `${out.summary.added} BVN(s) added to the watchlist`, out);
    } catch (e) {
      console.error("bvnWatchlist.upload error:", e?.response?.data || e);
      return jsonFailed(res, {}, "Failed to process CSV", 500);
    }
  },

  remove: async (req, res) => {
    try {
      const removed = await svc.remove(req.params.id);
      if (!removed) return jsonFailed(res, {}, "Entry not found", 404);
      return jsonS(res, 200, "BVN removed from the watchlist");
    } catch (e) {
      console.error("bvnWatchlist.remove error:", e);
      return jsonFailed(res, {}, "Failed to remove BVN", 500);
    }
  },

  // internal: Prembly says NIBSS has watchlisted this BVN
  nibssFlag: async (req, res) => {
    const { userId, bvn, message } = req.body;
    if (!userId || !bvn) return jsonFailed(res, {}, "userId and bvn are required", 400);
    try {
      const out = await svc.flagNibss({ userId, bvn, message });
      if (out.error) return jsonFailed(res, {}, out.error, out.status);
      return jsonS(res, 200, "OK", out);
    } catch (e) {
      console.error("bvnWatchlist.nibssFlag error:", e);
      return jsonFailed(res, {}, "Failed to record NIBSS watchlist hit", 500);
    }
  },

  // internal: called by the wallet service when a user submits a BVN
  screen: async (req, res) => {
    const { userId, bvn } = req.body;
    if (!userId || !bvn) return jsonFailed(res, {}, "userId and bvn are required", 400);
    try {
      return jsonS(res, 200, "OK", await svc.screen({ userId, bvn }));
    } catch (e) {
      console.error("bvnWatchlist.screen error:", e);
      return jsonFailed(res, {}, "Screening failed", 500);
    }
  },

  // internal: the wallet service deactivated accounts that share a BVN
  duplicateAlert: async (req, res) => {
    const accounts = req.body?.accounts;
    if (!Array.isArray(accounts) || !accounts.length) return jsonFailed(res, {}, "accounts required", 400);
    try {
      return jsonS(res, 200, "OK", await svc.alertDuplicates(accounts));
    } catch (e) {
      console.error("bvnWatchlist.duplicateAlert error:", e);
      return jsonFailed(res, {}, "Failed to send duplicate BVN alert", 500);
    }
  },

  // internal: the wallet service's BVN job hit an empty Prembly wallet
  providerBalanceAlert: async (req, res) => {
    const provider = String(req.body?.provider || "prembly");
    const pending = Math.max(parseInt(req.body?.pending, 10) || 0, 0);
    try {
      return jsonS(res, 200, "OK", await svc.alertProviderBalance({ provider, pending }));
    } catch (e) {
      console.error("bvnWatchlist.providerBalanceAlert error:", e);
      return jsonFailed(res, {}, "Failed to send provider balance alert", 500);
    }
  },
};

module.exports = Controller;
