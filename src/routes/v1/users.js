const express = require("express");
const auth = require("../../middlewares/ambassadorAuth/authMiddleware");
const { UsersController } = require("../../http/controller/users");

const router = express.Router();

router.get("/users", auth, UsersController.list);
router.get("/users/metrics", auth, UsersController.metrics);
router.get("/users/:id/orders", auth, UsersController.userOrders);
router.get("/users/:id/transactions", auth, UsersController.userTransactions);
router.patch("/users/:id/status", auth, UsersController.updateUserStatus);
router.get("/users/:id", auth, UsersController.userDetails);

module.exports = {
  baseUrl: "/admin",
  router,
};
