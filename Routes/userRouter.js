import express from "express";
import UserController from "../controllers/userController.js";

const router = express.Router();

router.get("/info-user", UserController.getInfoByIdUser);

export default router;
