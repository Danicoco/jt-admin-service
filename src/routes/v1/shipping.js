const express = require("express");
const auth = require("../../middlewares/ambassadorAuth/authMiddleware");
const { ShippingController } = require("../../http/controller/shipping");

const router = express.Router({ caseSensitive: true, });

router.get("/metrics", auth, ShippingController.metrics);
router.get("/addresses", auth, ShippingController.listAllAddress);
router.post("/addresses", auth, ShippingController.createAllAddress);
router.patch("/addresses/:id", auth, ShippingController.updateAllAddress);
router.get("/:id", auth, ShippingController.get);
router.post("/", auth, ShippingController.create);
router.patch("/:id", auth, ShippingController.update);
router.patch("/:id/pay-confirm", auth, ShippingController.update);
router.delete("/:id", auth, ShippingController.remove);
router.get("/", auth, ShippingController.list);

module.exports = {
    baseUrl: "/admin/shipping",
    router,
}