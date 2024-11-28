import connectDB from "../config/ConnectDB.js";

const updateOTPService = (otp, email) => {
  try {
    connectDB.query("UPDATE account SET otp = ? WHERE email = ?", [otp, email]);
  } catch (error) {
    console.log("update otp service fail");
  }
};

export default updateOTPService;
