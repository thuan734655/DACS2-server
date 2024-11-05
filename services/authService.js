import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectDB from "../config/ConnectDB.js";
import sendOTP from "../services/sendOTPService.js";
import updateOTPService from "../services/updateOTPService.js";

const SECRET_KEY =
  process.env.JWT_SECRET ||
  "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.VFb0qJ1LRg_4ujbZoRMXnVkUgiuKq5KxWqNdbKq_G9Vvz-S1zZa9LPxtHWKa64zDl2ofkT8F6jBt_K4riU-fPg";

const authService = {
    async findUserByEmail(email) {
      const [rows] = await connectDB.query(
        "SELECT * FROM account WHERE email = ?",
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

  export default authService;
  