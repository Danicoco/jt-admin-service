const express = require("express");
const auth = require("../../middlewares/ambassadorAuth/authMiddleware");
const { TradeController } = require("../../http/controller/trades");

const router = express.Router({ caseSensitive: true, });

router.get("/crypto", auth, TradeController.listCryptoTrans);
router.get("/charts", auth, TradeController.chart);
router.get("/metrics", auth, TradeController.metrics);
router.get("/gift-card-requests", auth, TradeController.giftCardRequest);
router.patch("/gift-card/:id/status", auth, TradeController.processGiftCard);


module.exports = {
    baseUrl: "/admin/trade",
    router,
}