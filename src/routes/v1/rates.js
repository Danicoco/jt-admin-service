const express = require("express");
const { RatesController } = require("../../http/controller/rates");
const auth = require("../../middlewares/ambassadorAuth/authMiddleware");
const { cloudConfig, uploadField } = require("../../services/cloudinaryService");

const router = express.Router();

router.post("/rates", auth, cloudConfig, uploadField("image", "rates"), RatesController.createRate);
router.get("/rates", auth, RatesController.listRates);
router.get("/platform-rate", auth, RatesController.getPlatformRate);
router.post("/platform-rate", auth, RatesController.createOrUpdatePlatformRate);
router.patch("/rates/:id", auth, cloudConfig, uploadField("image", "rates"), RatesController.updateRate);

module.exports = {
  baseUrl: "/admin",
  router,
};
