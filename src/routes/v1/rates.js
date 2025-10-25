const express = require("express");
const { RatesController } = require("../../http/controller/rates");
const auth = require("../../middlewares/ambassadorAuth/authMiddleware");

const router = express.Router();

router.post("/rates", auth, RatesController.createRate);
router.get("/rates", auth, RatesController.listRates);
router.patch("/rates/:id", auth, RatesController.updateRate);

module.exports = {
  baseUrl: "/admin",
  router,
};
