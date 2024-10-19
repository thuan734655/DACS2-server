import connectDB from "../ConnectDB.js";

const checkOTP = (email, otp, callBack) => {
  // Perform a query to the database
  connectDB.query(
    "SELECT otp FROM account WHERE email = ?",
    [email],
    (err, result) => {
      if (err || result.length === 0) {
        console.error("Database error:", err);
        return callBack(0); // Return false if there is an error in the query
      }

      const storedOtp = result[0].otp;

      // Check if the OTP does not match
      if (storedOtp.toString() !== otp.toString()) {
        return callBack(-1); // OTP does not match
      }

      return callBack(1); // OTP is valid
    }
  );
};

export default checkOTP;