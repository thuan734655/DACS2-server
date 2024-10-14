import express from "express";
import bodyParser from "body-parser";
import connectDB from "../ConnectDB.js";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import sendOTP from "../services/sendOTP.js";
dotenv.config();

// create router
const routerHandlePassword = express.Router();
routerHandlePassword.use(bodyParser.json());

routerHandlePassword.post("/forgotten", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).send("Email is required.");
  }
  const otp = sendOTP(email);
  
  // update otp in db
  const updateOTP = async (otp) => {
    try {
      connectDB.query("UPDATE account SET otp = ? WHERE email = ?", [
        otp,
        email,
      ]);
      res.status(200).send({ message: "Send OTP successful" });
    } catch (error) {
      res.status(500).send("Failed to send email.");
    }
  };
  updateOTP(otp);
});
routerHandlePassword.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).send({
      message: "Email and otp code are required.",
    });
  }
  // get otp in db
  const results = await connectDB.query(
    "SELECT otp FROM account WHERE email = ?",
    [email],
    async (err, result) => {
      if (err) throw err;

      if (results.length === 0) {
        return res.status(400).send({ message: "Email not found" });
      }

      const storeOtp = result[0].otp;

      if (storeOtp.toString() !== otp.toString()) {
        return res.status(400).send({ message: "Invalid OTP" });
      }
      await connectDB.query("UPDATE account SET otp = NULL WHERE email = ?", [
        email,
      ]);
      return res.status(200).send({ message: "OTP verified successfully" });
    }
  );
  routerHandlePassword.post("/change-password", async (req, res) => {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res
        .status(400)
        .send({ message: "Email and new password are required." });
    }

    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
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
});
export default routerHandlePassword;
