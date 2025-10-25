const express = require("express");
const { AuthController } = require("../../http/controller/auth");

const router = express.Router();

router.post("/signup", AuthController.signUp);
router.post("/login", AuthController.login);
router.post("/verify/phone", AuthController.verifyPhoneNumber);
router.post("/resend-otp", AuthController.resendVerificationOtp);
router.post("/forgot-password", AuthController.sendResetPassword);
router.post("/verify-otp", AuthController.verifyOtp);
router.patch("/reset-password", AuthController.resetPassword);

module.exports = {
    baseUrl: "/admin",
    router,
};