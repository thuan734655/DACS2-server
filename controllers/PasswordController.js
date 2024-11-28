import bcrypt from "bcrypt";
import connectDB from "../config/ConnectDB.js";
import sendOTP from "../models/sendOTPModel.js";
import updateOTPService from "../models/updateOTPServiceModel.js";
import updateInfoDevice from "../models/updateInfoDeviceModel.js";
import { handleResponse } from "../utils/createResponse.js";

class PasswordController {
  static async forgotten(req, res) {
    const { email } = req.body;

    if (!email) {
      return handleResponse(res, 400, "fail", "Email is required.");
    }

    try {
      const otp = await sendOTP(email);
      await updateOTPService(otp, email);
      return handleResponse(res, 200, "success", "OTP sent to email.");
    } catch (error) {
      console.error("Error sending OTP:", error);
      return handleResponse(res, 500, "error", "Failed to send OTP.");
    }
  }

  static async verifyOtp(req, res) {
    const { email, otp, infoDevice } = req.body;

    if (!email || !otp) {
      return handleResponse(
        res,
        400,
        "fail",
        "Email and OTP code are required."
      );
    }
    try {
      const [results] = await connectDB.query(
        "SELECT otp FROM account WHERE email = ?",
        [email]
      );
      console.log(results[0]);
      if (results.length === 0) {
        return handleResponse(res, 404, "fail", "Email not found.");
      }

      const storeOtp = results[0].otp;

      if (storeOtp.toString() !== otp.toString()) {
        return handleResponse(res, 400, "fail", "Invalid OTP.");
      }

      await updateOTPService("NULL", email);
      await updateInfoDevice(infoDevice, email);

      const updateIsActive = await connectDB.query(
        "UPDATE `account` SET `isActive`= 1 WHERE email = ?",
        [email]
      );

      if (updateIsActive) {
        return handleResponse(
          res,
          200,
          "success",
          "OTP verified successfully."
        );
      } else {
        return handleResponse(
          res,
          500,
          "error",
          "Failed to update account status."
        );
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      return handleResponse(res, 500, "error", "Internal server error.");
    }
  }

  static async changePassword(req, res) {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return handleResponse(
        res,
        400,
        "fail",
        "Email and new password are required."
      );
    }

    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await connectDB.query("UPDATE account SET password = ? WHERE email = ?", [
        hashedPassword,
        email,
      ]);
      return handleResponse(
        res,
        200,
        "success",
        "Password changed successfully."
      );
    } catch (error) {
      console.error("Database error:", error);
      return handleResponse(res, 500, "error", "Internal server error.");
    }
  }
}

export default PasswordController;
