const express = require("express");
const PasswordController = require("../controllers/PasswordController");

const router = express.Router();

router.post("/forgotten", PasswordController.forgotten);
router.post("/verify-otp", PasswordController.verifyOtp);
router.post("/change-password", PasswordController.changePassword);
router.post("/requestOTP", PasswordController.requestOTP);

module.exports = router;
