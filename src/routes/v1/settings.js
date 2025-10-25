const express = require("express");
const { SettingsController } = require("../../http/controller/settings");
const { cloudConfig, uploadField } = require("../../services/cloudinaryService");
const auth = require("../../middlewares/ambassadorAuth/authMiddleware");

const router = express.Router();

router.get("/settings", auth, SettingsController.getSettings);
router.patch("/settings", auth, cloudConfig, uploadField("cardImage", "admin-avatars"), SettingsController.updateSettings);
router.delete("/settings", auth, SettingsController.deleteAccount);
router.patch("/settings/change-password", auth, SettingsController.changePassword);

module.exports = {
    baseUrl: "/admin",
    router,
}