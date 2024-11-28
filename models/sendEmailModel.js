import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config(); // Cấu hình biến môi trường

const handleEmail = (data = {}) => {
  const { email, content, title, subject } = data;
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
    to: email,
    subject: subject,
    text: title,
    html: `<b>${content}</b>`,
  };

  // Hàm gửi email
  const sendMail = async () => {
    try {
      await transporter.sendMail(mailOptions); // Truyền `mailOptions` vào
      console.log("Email has been sent!");
    } catch (error) {
      console.error(error);
    }
  };
  sendMail();
};

export default handleEmail;
