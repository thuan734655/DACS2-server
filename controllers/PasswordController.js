const bcrypt = require("bcryptjs");
const connectDB = require("../config/ConnectDB");
const sendOTP = require("../models/sendOTPModel");
const updateOTPService = require("../models/updateOTPServiceModel");
const updateInfoDevice = require("../models/updateInfoDeviceModel");
const { handleResponse } = require("../utils/createResponse");
const { auth } = require("../config/firebaseConfig");

class PasswordController {
  static async forgotten(req, res) {
    const { email } = req.body;
    console.log(email, "password reset request");
    if (!email) {
      return handleResponse(res, 400, "fail", "Email is required.");
    }

    try {
      const otp = await sendOTP(email);
      await updateOTPService(otp, email);
      return handleResponse(res, 200, "success", "OTP sent to email.");
    } catch (error) {
      console.error("Error in forgotten password:", error);
      return handleResponse(res, 500, "fail", "Internal server error.");
    }
  }

  static async verifyOtp(req, res) {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return handleResponse(res, 400, "fail", "Email and OTP are required.");
    }

    try {
      const [rows] = await connectDB.query(
        "SELECT otp FROM account WHERE email = ?",
        [email]
      );

      if (rows.length === 0) {
        return handleResponse(res, 404, "fail", "Account not found.");
      }

      if (rows[0].otp !== otp) {
        return handleResponse(res, 400, "fail", "Invalid OTP.");
      }

      await connectDB.query(
        "UPDATE account SET isVerified = true, otp = NULL WHERE email = ?",
        [email]
      );

      return handleResponse(res, 200, "success", "OTP verified successfully.");
    } catch (error) {
      console.error("Error in OTP verification:", error);
      return handleResponse(res, 500, "fail", "Internal server error.");
    }
  }

  static async changePassword(req, res) {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return handleResponse(res, 400, "fail", "Email and new password are required.");
    }

    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await connectDB.query(
        "UPDATE account SET password = ? WHERE email = ?",
        [hashedPassword, email]
      );

      return handleResponse(res, 200, "success", "Password updated successfully.");
    } catch (error) {
      console.error("Error in password change:", error);
      return handleResponse(res, 500, "fail", "Internal server error.");
    }
  }

  static async requestOTP(req, res) {
    const { email } = req.body;

    if (!email) {
      return handleResponse(res, 400, "fail", "Email is required.");
    }

    try {
      const otp = await sendOTP(email);
      await updateOTPService(otp, email);
      return handleResponse(res, 200, "success", "OTP sent to email.");
    } catch (error) {
      console.error("Error in OTP request:", error);
      return handleResponse(res, 500, "fail", "Internal server error.");
    }
  }
}

module.exports = PasswordController;
