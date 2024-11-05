import sendOTP from "../services/sendOTPService.js";
import updateInfoDevice from "../services/updateInfoDeviceService.js";
import updateOTPService from "../services/updateOTPService.js";
import authService from "../services/authService.js";
import createResponse from "../services/createResponse.js";

class AuthController {
  static async login(req, res) {
    try {
      const { email, password, ip } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json(createResponse(false, "Email and password are required"));
      }

      const user = await authService.validateCredentials(email, password);

      const needs2FA = await authService.process2FA(user, email, ip);

      if (needs2FA) {
        return res
          .status(202)
          .json(createResponse(true, "2FA required", { requires2FA: true }));
      }
      if (user.isActive === 0) {
        return res
          .status(202)
          .json(
            createResponse(true, "Account is not active", { active: true })
          );
      }

      if (!user.infoDevice) {
        await updateInfoDevice(ip, email);
      }

      const token = authService.generateToken(user.idUser);
      return res.status(200).json(
        createResponse(true, "Login successful", {
          token,
          user: { id: user.idUser, email: user.email },
        })
      );
    } catch (error) {
      console.error("Login error:", error);
      const status = error.status || 500;
      return res
        .status(status)
        .json(createResponse(false, error.message || "Internal server error"));
    }
  }

  static async register(req, res) {
    try {
      const { email, password, day, month, year, fullName, gender } = req.body;

      if (
        !email ||
        !password ||
        !fullName ||
        !gender ||
        !day ||
        !month ||
        !year
      ) {
        return res
          .status(400)
          .json(createResponse(false, "All fields are required"));
      }

      const existingUser = await authService.findUserByEmail(email);
      if (existingUser) {
        return res
          .status(409)
          .json(createResponse(false, "Email already exists"));
      }

      const birthDate = new Date(`${year}-${month}-${day}`);
      const userId = await authService.createUser({
        email,
        password,
        fullName,
        gender,
        birthDate,
      });
      const otp = await sendOTP(email);
      await updateOTPService(otp, email);

      return res
        .status(201)
        .json(createResponse(true, "User registered successfully", { userId }));
    } catch (error) {
      console.error("Registration error:", error);
      return res
        .status(500)
        .json(createResponse(false, "Error creating account"));
    }
  }
}

export default AuthController;
