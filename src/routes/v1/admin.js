const express = require("express");
const { AdminController } = require("../../http/controller/admins");

const router = express.Router();

router.get("/", AdminController.list);

module.exports = {
    baseUrl: "/admin",
    router,
};