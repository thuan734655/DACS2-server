import handleEmail from "./sendEmailModel.js";

const sendOTP = (email) => {
  console.log(email, "send");
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  handleEmail({
    email: email,
    content: otp,
    title: "Your OTP code is ",
    subject: "OTP",
  });
  return otp;
};

export default sendOTP;
