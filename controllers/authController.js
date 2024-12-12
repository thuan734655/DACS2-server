const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const connectDB = require("../config/ConnectDB");
const sendOTP = require("../models/sendOTPModel");
const updateInfoDevice = require("../models/updateInfoDeviceModel");
const updateOTPService = require("../models/updateOTPServiceModel");
const { handleResponse } = require("../utils/createResponse");
const dotenv = require("dotenv");

dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET || "key";

const authService = {
  async findUserByEmail(email) {
    const [rows] = await connectDB.query(
      "SELECT u.idUser, u.fullName, u.avatar,infoDevice, a.password FROM user u JOIN account a ON u.idUser = a.idUser WHERE a.email = ?",
      [email]
    );
    console.log("Database query result:", rows[0]);
    return rows[0];
  },

  async validateCredentials(email, password) {
    const user = await this.findUserByEmail(email);
    if (!user) return null;
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  },

  async process2FA(user, email, ip) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOTP = await bcrypt.hash(otp, 10);
    
    await updateOTPService(email, hashedOTP);
    await sendOTP(email, otp);
    await updateInfoDevice(user.idUser, ip);
    
    return hashedOTP;
  },

  generateToken(userId) {
    return jwt.sign({ userId }, SECRET_KEY, { expiresIn: "24h" });
  },

  async createUser(userData) {
    const { email, password, fullName } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    try {
      await connectDB.beginTransaction();
      
      const [userResult] = await connectDB.query(
        "INSERT INTO user (fullName) VALUES (?)",
        [fullName]
      );
      
      const userId = userResult.insertId;
      await connectDB.query(
        "INSERT INTO account (email, password, idUser) VALUES (?, ?, ?)",
        [email, hashedPassword, userId]
      );
      
      await connectDB.commit();
      return userId;
    } catch (error) {
      await connectDB.rollback();
      throw error;
    }
  }
};

const AuthController = {
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const ip = req.ip || req.connection.remoteAddress;
      
      const user = await authService.validateCredentials(email, password);
      if (!user) {
        return handleResponse(res, 401, "Invalid credentials");
      }

      if (user.infoDevice && user.infoDevice !== ip) {
        const hashedOTP = await authService.process2FA(user, email, ip);
        return handleResponse(res, 200, "2FA required", { requireOTP: true, hashedOTP });
      }

      const token = authService.generateToken(user.idUser);
      return handleResponse(res, 200, "Login successful", {
        token,
        user: {
          idUser: user.idUser,
          fullName: user.fullName,
          avatar: user.avatar
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      return handleResponse(res, 500, "Internal server error");
    }
  },

  async register(req, res) {
    try {
      const { email, password, fullName } = req.body;
      
      const existingUser = await authService.findUserByEmail(email);
      if (existingUser) {
        return handleResponse(res, 409, "Email already exists");
      }

      const userId = await authService.createUser({ email, password, fullName });
      const token = authService.generateToken(userId);
      
      return handleResponse(res, 201, "Registration successful", { token });
    } catch (error) {
      console.error("Registration error:", error);
      return handleResponse(res, 500, "Internal server error");
    }
  }
};

module.exports = AuthController;
