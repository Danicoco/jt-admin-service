const express = require("express");
const auth = require("../../middlewares/ambassadorAuth/authMiddleware");
const { OrderController } = require("../../http/controller/order");

const router = express.Router();

router.get('/orders/summary', auth, OrderController.orderSummary);
router.get('/orders/chart', auth, OrderController.orderChart);
router.get('/orders', auth, OrderController.orderList);
router.get('/orders/top-categories', auth, OrderController.topCategories);
router.get('/orders/:id', auth, OrderController.getOrderById);


module.exports = {
    baseUrl: "/admin",
    router,
}