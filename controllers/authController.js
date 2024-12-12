import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectDB from "../config/ConnectDB.js";
import sendOTP from "../models/sendOTPModel.js";
import updateInfoDevice from "../models/updateInfoDeviceModel.js";
import updateOTPService from "../models/updateOTPServiceModel.js";
import { handleResponse } from "../utils/createResponse.js";
import dotenv from "dotenv";

dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET || "key";

const authService = {
  async findUserByEmail(email) {
    const [rows] = await connectDB.query(
      "SELECT u.idUser, u.fullName, u.avatar,infoDevice, a.password FROM user u JOIN account a ON u.idUser = a.idUser WHERE a.email = ?",
      [email]
    );
    return rows[0];
  },

  async validateCredentials(email, password) {
    const user = await this.findUserByEmail(email);
    if (!user) throw { status: 404, message: "User not found" };
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) throw { status: 401, message: "Invalid credentials" };

    return user;
  },

  async process2FA(user, email, ip) {
    console.log(user.infoDevice && ip != user.infoDevice, "check 2FA");
    console.log(ip, user.infoDevice, "heh>>???fsd", user);
    if (user.infoDevice && ip !== user.infoDevice) {
      const otp = await sendOTP(email);
      await updateOTPService(otp, email);
      return true;
    }

    return false;
  },

  generateToken(userId) {
    return jwt.sign({ id: userId }, SECRET_KEY, { expiresIn: "1h" });
  },

  async createUser(userData) {
    const { email, password, fullName, gender, birthDate } = userData;
    const connection = await connectDB.getConnection();
    try {
      await connection.beginTransaction();
      const hashedPassword = await bcrypt.hash(password, 10);
      const [accountResult] = await connection.query(
        "INSERT INTO account (email, password) VALUES (?, ?)",
        [email, hashedPassword]
      );
      await connection.query(
        "INSERT INTO user (fullName, gender, birthday, idUser) VALUES (?, ?, ?, ?)",
        [fullName, gender, birthDate, accountResult.insertId]
      );
      await connection.commit();
      return accountResult.insertId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },
};

class AuthController {
  static async login(req, res) {
    try {
      const { email, password, ip } = req.body;
      const query =
        "SELECT u.idUser, u.fullName, u.avatar, a.password FROM user u JOIN account a ON u.idUser = a.idUser WHERE a.email = ?";

      connectDB.query(query, [email, password], (err, result) => {
        if (err) return res.status(500).json({ error: "Lỗi server" });

        if (result.length > 0) {
          // Trả về thông tin user nếu đăng nhập thành công
          res.status(200).json(result[0]);
        } else {
          res.status(401).json({ error: "Sai tài khoản hoặc mật khẩu" });
        }
      });

      if (!email || !password) {
        return handleResponse(
          res,
          400,
          false,
          "Email and password are required"
        );
      }

      const user = await authService.validateCredentials(email, password);
      console.log(user);

      const needs2FA = await authService.process2FA(user, email, ip);

      if (needs2FA) {
        console.log("2FA ok");
        return handleResponse(res, 202, true, "2FA required", {
          requires2FA: true,
        });
      }
      if (user.isActive === 0) {
        return handleResponse(res, 202, true, "Account is not active", {
          active: true,
        });
      }

      if (!user.infoDevice) {
        await updateInfoDevice(ip, email);
      }

      const token = authService.generateToken(user.idUser);
      console.log(user.fullName);

      return handleResponse(res, 200, true, "Login successful", {
        user: {
          idUser: user.idUser,
          email: user.email,
          fullName: user.fullName,
          avatar: user.avatar,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      const status = error.status || 500;
      return handleResponse(
        res,
        status,
        false,
        error.message || "Internal server error"
      );
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
        return handleResponse(res, 400, false, "All fields are required");
      }

      const existingUser = await authService.findUserByEmail(email);
      if (existingUser) {
        return handleResponse(res, 409, false, "Email already exists");
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

      return handleResponse(res, 201, true, "User registered successfully", {
        userId,
      });
    } catch (error) {
      console.error("Registration error:", error);
      return handleResponse(res, 500, false, "Error creating account");
    }
  }
}

export default AuthController;
