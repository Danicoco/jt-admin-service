const express = require("express");
const { RoleController } = require("../../http/controller/roles");
const auth = require("../../middlewares/ambassadorAuth/authMiddleware");

const router = express.Router();

router.get('/roles', auth, RoleController.list);
router.get('/roles/permissions', auth, RoleController.permissionList);
router.post('/roles', auth, RoleController.create);
router.patch('/roles/:id', auth, RoleController.update);
router.delete('/roles/:id', auth, RoleController.remove);

module.exports = {
    baseUrl: "/admin",
    router,
}