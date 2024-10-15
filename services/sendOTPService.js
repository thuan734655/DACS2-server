import generateOTP from "./generateOTPService.js"
import handleEmail from "./sendEmailService.js";

const sendOTP = (email) => {
  const otp = generateOTP();
  handleEmail({
    email: email,
    content: otp,
    title: "Your OTP code is ",
    subject: "OTP",
  });
  return otp;
};

export default sendOTP;
