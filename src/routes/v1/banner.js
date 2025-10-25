const express = require("express");
const { BannerController } = require("../../http/controller/banners");
const auth = require("../../middlewares/ambassadorAuth/authMiddleware");

const router = express.Router();

router.get('/banners', auth, BannerController.list);
router.post('/banners', auth, BannerController.create);
router.patch('/banners/:id', auth, BannerController.update);
router.delete('/banners/:id', auth, BannerController.remove);

module.exports = {
    baseUrl: "/admin",
    router,
}