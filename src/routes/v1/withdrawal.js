const express = require("express");
const auth = require("../../middlewares/ambassadorAuth/authMiddleware");
const { requirePermission } = require("../../middlewares/requirePermission");
const { WithdrawalController } = require("../../http/controller/withdrawals");

const router = express.Router();

const view = [auth, requirePermission("Withdrawal", "canView")];

router.get("/withdrawals", view, WithdrawalController.list);
router.get("/withdrawals/summary", view, WithdrawalController.summary);

module.exports = {
  baseUrl: "/admin",
  router,
};
