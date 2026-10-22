const express = require("express");
const auth = require("../../middlewares/ambassadorAuth/authMiddleware");
const { UsersController } = require("../../http/controller/users");
const { requirePermission } = require("../../middlewares/requirePermission");

const router = express.Router();

router.get("/users", auth, UsersController.list);
router.get("/users/metrics", auth, UsersController.metrics);
router.get("/users/:id/orders", auth, UsersController.userOrders);
router.get("/users/:id/transactions", auth, UsersController.userTransactions);
router.patch("/users/:id/status", auth, UsersController.updateUserStatus);
router.patch("/users/:id/risk", auth, UsersController.updateUserRisk);
// each attempt is a billed Prembly lookup
router.post("/users/:id/verify-bvn", auth, requirePermission("Customer", "canUpdate"), UsersController.verifyUserBvn);
router.get("/users/:id", auth, UsersController.userDetails);

module.exports = {
  baseUrl: "/admin",
  router,
};
