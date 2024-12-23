import bcrypt from "bcryptjs"; // Sử dụng bcryptjs
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
  // Tìm người dùng theo email
  async findUserByEmail(email) {
    const [rows] = await connectDB.query(
      "SELECT u.idUser, u.fullName, u.avatar, infoDevice, isAdmin, u.background, isActive, a.password FROM user u JOIN account a ON u.idUser = a.idUser WHERE a.email = ?",
      [email]
    );
    console.log("Kết quả truy vấn cơ sở dữ liệu:", rows[0]);
    return rows[0];
  },

  // Kiểm tra email và mật khẩu của người dùng
  async validateCredentials(email, password) {
    const user = await this.findUserByEmail(email);
    if (!user) throw { status: 404, message: "User not found" };

    // Sử dụng bcryptjs để so sánh mật khẩu
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword)
      throw { status: 401, message: "Thông tin đăng nhập không hợp lệ" };

    return user;
  },

  async process2FA(user, email, ip) {
    if (user.infoDevice && ip !== user.infoDevice) {
      const otp = await sendOTP(email);
      await updateOTPService(otp, email);
      return true;
    }
    return false;
  },

  // Tạo token JWT cho người dùng
  generateToken(userId) {
    return jwt.sign({ id: userId }, SECRET_KEY, { expiresIn: "1h" });
  },

  // Tạo người dùng mới
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
  // Đăng nhập
  static async login(req, res) {
    try {
      const { email, password, ip } = req.body;

      const user = await authService.validateCredentials(email, password);
      const needs2FA = await authService.process2FA(user, email, ip);

      if (needs2FA) {
        return handleResponse(res, 202, true, "Yêu cầu 2FA", {
          requires2FA: true,
          user: {
            idUser: user.idUser,
            email: user.email,
            fullName: user.fullName,
            avatar: user.avatar,
            isAdmin: user.isAdmin,
            background: user.background,
          },
        });
      }
      if (user.isActive === 0) {
        const otp = await sendOTP(email);
        await updateOTPService(otp, email);

        return handleResponse(res, 202, true, "Tài khoản không hoạt động", {
          active: true,
          user: {
            idUser: user.idUser,
            email: user.email,
            fullName: user.fullName,
            avatar: user.avatar,
            isAdmin: user.isAdmin,
            background: user.background,
          },
        });
      }

      if (!user.infoDevice) {
        await updateInfoDevice(ip, email);
      }

      console.log("Thông tin người dùng sau khi đăng nhập:", {
        idUser: user.idUser,
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar,
        background: user.background,
      });
      const token = authService.generateToken(user.idUser);

      return handleResponse(res, 200, true, "Đăng nhập thành công", {
        user: {
          idUser: user.idUser,
          email: user.email,
          fullName: user.fullName,
          avatar: user.avatar,
          isAdmin: user.isAdmin,
          background: user.background,
        },
        token,
      });
    } catch (error) {
      const status = error.status || 500;
      return handleResponse(res, status, false, error.message || "Lỗi server");
    }
  }

  // Đăng ký người dùng
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
        return handleResponse(res, 400, false, "Tất cả các trường là bắt buộc");
      }

      const existingUser = await authService.findUserByEmail(email);
      if (existingUser) {
        return handleResponse(res, 409, false, "Email đã tồn tại");
        return handleResponse(res, 409, false, "Email đã tồn tại");
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

      return handleResponse(
        res,
        201,
        true,
        "Người dùng đã đăng ký thành công",
        { userId }
      );
    } catch (error) {
      console.error("Registration error:", error);
      return handleResponse(res, 500, false, "Error creating account");
    }
  }
}

export default AuthController;
