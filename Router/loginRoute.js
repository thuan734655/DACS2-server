import express from "express";
import bodyParser from "body-parser";
import connectDB from "../ConnectDB.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sendOTP from "../services/sendOTPService.js";
import updateInfoDevice from "../services/updateInfoDeviceService.js";
import updateOTPService from "../services/updateOTPService.js";
import checkEmail from "../services/checkEmail.js";

const routerLogin = express.Router();

routerLogin.use(bodyParser.json());

// Replace with your actual secret key
const secrecKey =
  "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.VFb0qJ1LRg_4ujbZoRMXnVkUgiuKq5KxWqNdbKq_G9Vvz-S1zZa9LPxtHWKa64zDl2ofkT8F6jBt_K4riU-fPg"; // Replace with your secret key

// Login API
routerLogin.post("/login", async (req, res) => {
  const { email, password, ip } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please enter your email and password." });
  }

  const query = "SELECT * FROM account WHERE email = ?";
  connectDB.query(query, [email], async (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ message: "Internal server error." });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Email not found." });
    } else {
      const user = result[0];

      //check account active
      if (user.isActive === 0) {
        return res.json({ message: "Account is not active" });
      }

      bcrypt.compare(password, user.password, async (err, isMatch) => {
        if (err) {
          console.error("Error comparing passwords:", err);
          return res.status(500).json({ message: "Internal server error." });
        }
        if (!isMatch) {
          return res.status(401).json({ message: "Incorrect password." });
        }

        const token = jwt.sign({ id: user.idUser }, secrecKey, {
          expiresIn: "1h",
        });

        try {
          // Handle 2FA requirement if device info differs
          if (user.infoDevice && ip !== user.infoDevice) {
            const otp = sendOTP(email);
            updateOTPService(otp, email);
            return res.json({
              message: "Two-factor authentication is required.",
              is2FA: true,
            });
          }

          // Update device info on first login or after 2FA success
          if (!user.infoDevice) {
            updateInfoDevice(ip, email);
          }

          // Respond with token if login is successful and no 2FA is required
          return res.json({
            message: "Login successful!",
            token,
            user: {
              id: user.idUser,
              email: user.email,
            },
          });
        } catch (error) {
          console.error("Error processing login:", error);
          return res.status(500).json({ message: "Unable to process login." });
        }
      });
    }
  });
});

// Sign-up API
routerLogin.post("/signup", async (req, resAPI) => {
  const { email, password, day, month, year, fullName, gender } = req.body;

  if (!fullName || !email || !password || !day || !month || !year || !gender) {
    return resAPI.status(400).json({ message: "Please fill in all fields" });
  }

  const birthStr = `${year}-${month}-${day}`;
  const birthDate = new Date(birthStr);

  if (isNaN(birthDate.getTime())) {
    return resAPI.status(400).json({ message: "Invalid birth date" });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const emailExists = await checkEmail(email);

    if (emailExists) {
      return resAPI.status(409).json({ message: "Email already exists" });
    }

    const queryInsert = "INSERT INTO account (email, password) VALUES (?, ?)";
    await connectDB.query(
      queryInsert,
      [email, hash],
      async (errInsertAccount, resultInsertAccount) => {
        if (errInsertAccount) {
          return resAPI.status(500).json({ message: "Create Account failed!" });
        } else if (resultInsertAccount.affectedRows > 0) {
          const userProfileQuery =
            "INSERT INTO user (fullName, gender, birthday, idUser) VALUES (?, ?, ?, LAST_INSERT_ID())";
          await connectDB.query(
            userProfileQuery,
            [fullName, gender, birthDate],
            async (errInsertUser, resultInsertUser) => {
              if (errInsertUser) {
                return resAPI
                  .status(500)
                  .json({ message: "Create User failed!" });
              }
              // Check if the user was successfully added
              else if (resultInsertUser.affectedRows > 0) {
                console.log("Account signed up successfully!");
                // Create OTP to verify email
                const OTP = sendOTP(email);
                updateOTPService(OTP, email);
                return resAPI.status(200).json({
                  message: "Account signed up successfully!",
                  status: 200,
                });
              } else {
                // If not successful, delete the account just created
                const queryDelete = "DELETE FROM `account` WHERE email = ?"; // Use email to delete
                await connectDB.query(queryDelete, [email]); // Delete by email instead of LAST_INSERT_ID()
                console.error(
                  "Failed to insert user profile. Account has been deleted."
                );
                return resAPI
                  .status(500)
                  .json({ message: "Account signed up failed!" });
              }
            }
          );
        }
      }
    );
  } catch (error) {
    console.error("Error during sign-up:", error);
    return resAPI.status(500).json({ message: "Error creating user profile." });
  }
});

export default routerLogin;
