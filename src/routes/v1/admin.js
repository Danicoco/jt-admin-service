const express = require("express");
const { AdminController } = require("../../http/controller/admins");
const auth = require("../../middlewares/ambassadorAuth/authMiddleware");
const { requirePermission } = require("../../middlewares/requirePermission");

const router = express.Router();

router.get("/", auth, AdminController.list);
router.patch("/:id/status", auth, requirePermission("Admin", "canUpdate"), AdminController.updateStatus);

module.exports = {
    baseUrl: "/admin",
    router,
};