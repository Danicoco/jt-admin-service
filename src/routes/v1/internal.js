const express = require('express');
const requireInternalKey = require("../../middlewares/ambassadorAuth/internalAuth");
const { ShippingController } = require("../../http/controller/shipping");
const { RatesController } = require("../../http/controller/rates");
const { DropOffController } = require('../../http/controller/dropoffs');
const { cloudConfig, uploadField } = require("../../services/cloudinaryService");

const router = express.Router();

router.post("/shipping", requireInternalKey, ShippingController.create);
router.get( "/shipping", requireInternalKey, ShippingController.list);
router.post( "/shipping/drop-off", requireInternalKey, DropOffController.create);
router.get("/shipping/drop-off", requireInternalKey, DropOffController.list);
router.get("/shipping/drop-off/:id", requireInternalKey, DropOffController.get);
router.patch("/shipping/drop-off/:id", requireInternalKey, DropOffController.update);
router.get("/rates", requireInternalKey, RatesController.listRates);
router.get("/rates/crypto/:name", requireInternalKey, RatesController.getCryptoRateByName);
router.get("/rates/all", requireInternalKey, RatesController.getInternalRates);
router.get('/rates/shipping/categories', requireInternalKey, RatesController.listShippingCategories);
router.get('/rates/shipping/products',   requireInternalKey, RatesController.listShippingProducts);
router.get('/rates/shipping/catalog', requireInternalKey, RatesController.listShippingCatalog);
router.get('/rates/platform', requireInternalKey, RatesController.getPlatformRate);

router.get( "/shipping/:id", requireInternalKey, ShippingController.get);
router.patch( "/shipping/:id/pay-confirm", requireInternalKey, ShippingController.confirmPay);

module.exports = {
  baseUrl: '/admin/internal',
  router
};
