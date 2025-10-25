const express = require("express");
const { NotificationController } = require("../../http/controller/notifications");
const auth = require("../../middlewares/ambassadorAuth/authMiddleware");

const router = express.Router();

router.get('/notifications', auth, NotificationController.list);
router.post('/notifications', auth, NotificationController.create);

module.exports = {
    baseUrl: "/admin",
    router,
}