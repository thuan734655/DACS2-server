import connectDB from "../ConnectDB.js";

const checkEmail = (email) => {
  return new Promise((resolve, reject) => {
    connectDB.query(
      "SELECT idUser FROM `account` WHERE email = ?",
      [email],
      (err, results) => {
        if (err) {
          return reject(err);
        }
        // Resolve with true if the email exists, false otherwise
        resolve(results.length > 0);
      }
    );
  });
};

export default checkEmail;
