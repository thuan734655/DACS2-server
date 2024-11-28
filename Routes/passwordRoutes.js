import express from "express";
import PasswordController from "../controllers/PasswordController.js";

const router = express.Router();

router.post("/forgotten", PasswordController.forgotten);
router.post("/verify-otp", PasswordController.verifyOtp);
router.post("/change-password", PasswordController.changePassword);

export default router;
