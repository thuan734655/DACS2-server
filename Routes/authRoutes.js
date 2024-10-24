import express from "express";
import AuthController from "../controllers/authController.js";

const routerLogin = express.Router();

routerLogin.post("/v1/auth/login", AuthController.login);
routerLogin.post("/v1/auth/register", AuthController.register);

export default routerLogin;
