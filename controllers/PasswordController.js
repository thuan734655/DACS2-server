import bcrypt from "bcrypt";
import connectDB from "../config/ConnectDB.js";
import sendOTP from "../services/sendOTPService.js";
import updateOTPService from "../services/updateOTPService.js";
import updateInfoDevice from "../services/updateInfoDeviceService.js";

class PasswordController {
  static async forgotten(req, res) {
    const { email } = req.body;

    if (!email) {
      return res.status(400).send("Email is required.");
    }

    // Gửi OTP
    const otp = await sendOTP(email);
    // Cập nhật OTP vào cơ sở dữ liệu
    await updateOTPService(otp, email);

    return res.status(200).send({ message: "OTP sent to email." });
  }

  static async verifyOtp(req, res) {
    const { email, otp, infoDevice } = req.body;

    if (!email || !otp) {
      return res.status(400).send({
        message: "Email and OTP code are required.",
      });
    }

    // Lấy OTP từ cơ sở dữ liệu
    const [results] = await connectDB.query(
      "SELECT otp FROM account WHERE email = ?",
      [email]
    );

    if (results.length === 0) {
      return res.status(400).send({ message: "Email not found." });
    }

    const storeOtp = results[0].otp;

    if (storeOtp.toString() !== otp.toString()) {
      return res.status(400).send({ message: "Invalid OTP." });
    }

    // Cập nhật OTP và thông tin thiết bị
    await updateOTPService("NULL", email);
    await updateInfoDevice(infoDevice, email);

    //update isActiv
    const updateIsActive = await connectDB.query(
      "UPDATE `account` SET `isActive`= 1 WHERE email = ?",
      [email]
    );
    if (updateIsActive) {
      return res.status(200).send({ message: "OTP verified successfully." });
    } else {
      return res.status(500).send({ message: "Internal server error" });
    }
  }

  static async changePassword(req, res) {
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
      return res
        .status(200)
        .send({ message: "Password changed successfully." });
    } catch (error) {
      console.error("Database error:", error);
      return res.status(500).send({ message: "Internal server error." });
    }
  }
}

export default PasswordController;
