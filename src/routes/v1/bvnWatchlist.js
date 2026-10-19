const express = require("express");
const auth = require("../../middlewares/ambassadorAuth/authMiddleware");
const { BvnWatchlistController } = require("../../http/controller/bvnWatchlist");

const router = express.Router();

router.get("/", auth, BvnWatchlistController.list);
router.get("/summary", auth, BvnWatchlistController.summary);
router.post("/", auth, BvnWatchlistController.add);
router.post("/upload", auth, BvnWatchlistController.upload);
router.delete("/:id", auth, BvnWatchlistController.remove);

module.exports = {
  baseUrl: "/admin/bvn-watchlist",
  router,
};
