import express from "express";
import bodyParser from "body-parser";
import connectDB from "../ConnectDB.js";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import sendOTP from "../services/sendOTPService.js";
import updateOTPService from "../services/updateOTPService.js";
import checkEmail from "../services/checkEmail.js";
import checkOTP from "../services/checkOTP.js";

dotenv.config();

// create router
const routerHandlePassword = express.Router();
routerHandlePassword.use(bodyParser.json());

// Route: /forgotten
routerHandlePassword.post("/requestOTP", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).send("Email is required.");
  }

  try {
    // Generate OTP and send it
    const otp = await sendOTP(email);

    // Update OTP in the database
    await updateOTPService(otp, email);

    res.status(200).send({ message: "OTP sent successfully." });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).send({ message: "Internal server error." });
  }
});

// Route: /change-password
routerHandlePassword.post("/change-password", async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res
      .status(400)
      .send({ message: "Email and new password are required." });
  }

  try {
    // Check if email exists
    const emailExists = await checkEmail(email);

    if (!emailExists) {
      return res.status(409).json({ message: "Email already exists" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in the database
    await connectDB.query("UPDATE account SET password = ? WHERE email = ?", [
      hashedPassword,
      email,
    ]);

    res.status(200).send({ message: "Password changed successfully." });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).send({ message: "Internal server error." });
  }
});

export default routerHandlePassword;
