import express from "express";
import AuthController from "../controllers/authController.js";

const router = express.Router();

router.post("/v1/auth/login", AuthController.login);
router.post("/v1/auth/register", AuthController.register);

export default router;
