import generateOTP from "../Router/utils/generateOTP.js";
import handleEmail from "./sendEmail.js";

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
