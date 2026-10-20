const express = require("express");
const auth = require("../../middlewares/ambassadorAuth/authMiddleware");
const { requirePermission } = require("../../middlewares/requirePermission");
const { BvnWatchlistController } = require("../../http/controller/bvnWatchlist");

const router = express.Router();

const view = [auth, requirePermission("Watchlist", "canView")];
const create = [auth, requirePermission("Watchlist", "canCreate")];
const remove = [auth, requirePermission("Watchlist", "canDelete")];

router.get("/", view, BvnWatchlistController.list);
router.get("/summary", view, BvnWatchlistController.summary);
router.post("/", create, BvnWatchlistController.add);
router.post("/upload", create, BvnWatchlistController.upload);
router.delete("/:id", remove, BvnWatchlistController.remove);

module.exports = {
  baseUrl: "/admin/bvn-watchlist",
  router,
};
