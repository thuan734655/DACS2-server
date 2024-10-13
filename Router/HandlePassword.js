import express from "express";
import bodyParser from "body-parser";
import connectDB from "../ConnectDB.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
dotenv.config(); // Cấu hình biến môi trường

const routerHandlePassword
 = express.Router();
routerHandlePassword
.use(bodyParser.json());

// Hàm sinh mã OTP ngẫu nhiên
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000); // Sinh mã OTP gồm 6 chữ số
}

routerHandlePassword
.post("/forgotten", async (req, res) => {
  const { email } = req.body; // Nhận email từ người dùng gửi trong request

  if (!email) {
    return res.status(400).send("Email is required.");
  }

  // Sinh mã OTP
  const otp = generateOTP();

  // Tạo transporter cho Nodemailer
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for port 465, false for other ports
    auth: {
      user: process.env.USER, // email từ biến môi trường
      pass: process.env.APP_PASSWORD, // mật khẩu ứng dụng từ biến môi trường
    },
  });

  // Tùy chọn email
  const mailOptions = {
    from: {
      name: "IT NETWORK",
      address: process.env.USER,
    },
    to: email, // Gửi email tới địa chỉ của người dùng
    subject: "Your OTP Code", // Chủ đề email
    text: `Your OTP code is ${otp}`, // Nội dung text
    html: `<b>Your OTP code is ${otp}</b>`, // Nội dung HTML
  };

  // Hàm gửi email
  const sendMail = async () => {
    try {
      await transporter.sendMail(mailOptions); // Truyền `mailOptions` vào
      await connectDB.query("UPDATE account SET otp = ? WHERE email = ?", [
        otp,
        email,
      ]);
      console.log("Email has been sent!");
      res.status(200).send("OTP sent successfully to your email.");
    } catch (error) {
      console.error(error);
      res.status(500).send("Failed to send email.");
    }
  };
  // Gọi hàm gửi email
  sendMail();
});
routerHandlePassword
.post("/verify-otp", async (req, res) => {
  const { email, otp,  } = req.body;
  if (!email || !otp) {
    return res.status(400).send({
      message: "Email and otp code are required.",
    });
  }
  // get otp

  // try {
  // lỗi (intermediate value) is not iterable là do e sử dụng result ko đúng
  const results = await connectDB.query(
    "SELECT otp FROM account WHERE email = ?",
    [email],
    async function (err, result) {
      if (err) throw err;
      // dùng thằng mysql connect này logic phải vứt vào trong function này r. nó ko trả ra ngoài
      // tìm hiểu thằng này "sequelize". code dễ hơn đó.
      // log như này sẽ thấy được mình lấy đúng data chưa!
      // console.log(result?.[0]?.otp);
      if (results.length === 0) {
        return res.status(400).send({ message: "Email not found" });
      }
      // đầu tiên khi gặp lỗi nó sẽ báo dòng
      // log biến ra rồi check ở dưới terminal kia sẽ có data.addEventListener('//', listener, options)
      // console.log(results);

      const storeOtp = result[0].otp;
      // console.log(storeOtp, otp, "storeOtp");
      if (storeOtp.toString() !== otp.toString()) {
        return res.status(400).send({ message: "Invalid OTP" });
      }
      await connectDB.query("UPDATE account SET otp = NULL WHERE email = ?", [
        email,
      ]);
      return res.status(200).send({ message: "OTP verified successfully" });
      // return result?.[0]?.otp;
      // return Promise.resolve(result);
      
    }
  );
  routerHandlePassword
  .post("/change-password", async (req, res) => {
    const { email, newPassword } = req.body;
  
    if (!email || !newPassword) {
      return res.status(400).send({ message: "Email and new password are required." });
    }
  
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await connectDB.query("UPDATE account SET password = ? WHERE email = ?", [hashedPassword, email]);
      res.status(200).send({ message: "Password changed successfully." });
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).send({ message: "Internal server error." });
    }
  });
});
export default routerHandlePassword
;
