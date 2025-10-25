const express = require("express");
const { DashboardController } = require("../../http/controller/dashboard");
const auth = require("../../middlewares/ambassadorAuth/authMiddleware");

const router = express.Router();

router.get('/dashboard/summary', auth, DashboardController.summary);
router.get('/dashboard/latest-orders', auth, DashboardController.latestOrders);
router.get('/dashboard/top-products', auth, DashboardController.topProducts);

module.exports = {
    baseUrl: "/admin",
    router,
}