import express from "express";
import PasswordController from "../controllers/PasswordController.js";

const routerHandlePassword = express.Router();

routerHandlePassword.post("/forgotten", PasswordController.forgotten);
routerHandlePassword.post("/verify-otp", PasswordController.verifyOtp);
routerHandlePassword.post("/change-password", PasswordController.changePassword);

export default routerHandlePassword;