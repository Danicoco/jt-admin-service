const express = require("express");
const { DropOffController } = require("../../http/controller/dropoffs");
const auth = require("../../middlewares/ambassadorAuth/authMiddleware");

const router = express.Router();

router.get('/drop-offs', auth, DropOffController.list);
router.patch('/drop-offs/:id', auth, DropOffController.update);
router.get('/drop-offs/:id', auth, DropOffController.get);

module.exports = {
    baseUrl: "/admin",
    router,
}