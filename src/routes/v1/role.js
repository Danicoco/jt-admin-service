const express = require("express");
const { RoleController } = require("../../http/controller/roles");
const auth = require("../../middlewares/ambassadorAuth/authMiddleware");
const { requirePermission } = require("../../middlewares/requirePermission");

const router = express.Router();

router.get('/roles', auth, RoleController.list);
router.get('/roles/permissions', auth, RoleController.permissionList);
router.post('/roles', auth, RoleController.create);
router.patch('/roles/:id', auth, RoleController.update);
router.delete('/roles/:id', auth, requirePermission("Role", "canDelete"), RoleController.remove);

module.exports = {
    baseUrl: "/admin",
    router,
}