const express = require("express");
const auth = require("../../middlewares/ambassadorAuth/authMiddleware");
const { WithdrawalController } = require("../../http/controller/withdrawals");

const router = express.Router();

router.get("/withdrawals", auth, WithdrawalController.list);
router.get("/withdrawals/summary", auth, WithdrawalController.summary);

module.exports = {
  baseUrl: "/admin",
  router,
};
