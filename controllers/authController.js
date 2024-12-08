import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectDB from "../config/ConnectDB.js";
import sendOTP from "../models/sendOTPModel.js";
import updateInfoDevice from "../models/updateInfoDeviceModel.js";
import updateOTPService from "../models/updateOTPServiceModel.js";
import { handleResponse } from "../utils/createResponse.js";

const SECRET_KEY = process.env.JWT_SECRET || "your-secret-key";

const authService = {
  async findUserByEmail(email) {
    const [rows] = await connectDB.query(
      "SELECT u.idUser, u.fullName, u.avatar, u.background, a.password FROM user u JOIN account a ON u.idUser = a.idUser WHERE a.email = ?",
      [email]
    );
    console.log("Kết quả truy vấn cơ sở dữ liệu:", rows[0]);
    return rows[0];
  },

  async validateCredentials(email, password) {
    const user = await this.findUserByEmail(email);
    if (!user) throw { status: 404, message: "Không tìm thấy người dùng" };
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) throw { status: 401, message: "Thông tin đăng nhập không hợp lệ" };

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
        "SELECT u.idUser, u.fullName, u.avatar, u.background, a.password FROM user u JOIN account a ON u.idUser = a.idUser WHERE a.email = ?";

      connectDB.query(query, [email, password], (err, result) => {
        if (err) return res.status(500).json({ error: "Lỗi server" });

        if (result.length > 0) {
          // Trả về thông tin người dùng nếu đăng nhập thành công
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
          "Email và mật khẩu là bắt buộc"
        );
      }

      const user = await authService.validateCredentials(email, password);
      console.log(user);

      const needs2FA = await authService.process2FA(user, email, ip);

      if (needs2FA) {
        return handleResponse(res, 202, true, "Xác thực 2 yếu tố được yêu cầu", {
          requires2FA: true,
        });
      }
      if (user.isActive === 0) {
        return handleResponse(res, 202, true, "Tài khoản chưa được kích hoạt", {
          active: true,
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

      return handleResponse(res, 200, true, "Đăng nhập thành công", {
        user: {
          idUser: user.idUser,
          email: user.email,
          fullName: user.fullName,
          avatar: user.avatar,
          background: user.background,
        },
      });
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      const status = error.status || 500;
      return handleResponse(
        res,
        status,
        false,
        error.message || "Lỗi máy chủ nội bộ"
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
        return handleResponse(res, 400, false, "Tất cả các trường đều bắt buộc");
      }

      const existingUser = await authService.findUserByEmail(email);
      if (existingUser) {
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

      return handleResponse(res, 201, true, "Người dùng đã được đăng ký thành công", {
        userId,
      });
    } catch (error) {
      console.error("Lỗi đăng ký:", error);
      return handleResponse(res, 500, false, "Lỗi tạo tài khoản");
    }
  }

  static async verifyOTP(req, res) {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return handleResponse(res, 400, false, "Email và mã OTP là bắt buộc");
      }

      const [rows] = await connectDB.query(
        "SELECT otp FROM account WHERE email = ?",
        [email]
      );

      if (rows.length === 0) {
        return handleResponse(res, 404, false, "Không tìm thấy tài khoản");
      }

      if (rows[0].otp !== otp) {
        return handleResponse(res, 400, false, "Mã OTP không hợp lệ");
      }

      await connectDB.query(
        "UPDATE account SET isVerified = true, otp = NULL WHERE email = ?",
        [email]
      );

      return handleResponse(res, 200, true, "Xác thực OTP thành công");
    } catch (error) {
      console.error("Lỗi xác thực OTP:", error);
      return handleResponse(res, 500, false, "Lỗi xác thực OTP");
    }
  }
}

export default AuthController;
