import express from "express";
import bodyParser from "body-parser";
import connectDB from "../ConnectDB.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import handleEmail from "../services/sendEmail.js";
import sendOTP from "../services/sendOTP.js";

const routerLogin = express.Router();

routerLogin.use(bodyParser.json());

// Replace with your actual secret key
const secrecKey = "your-secret-key";

// Login API
routerLogin.post("/login", async (req, res) => {
  const { email, password, ip } = req.body;
  let is2FA = false;

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
    }

    const user = result[0];

    bcrypt.compare(password, user.password, async (err, isMatch) => {
      if (err) {
        console.error("Error comparing passwords:", err);
        return res.status(500).json({ message: "Internal server error." });
      }
      if (!isMatch) {
        return res.status(401).json({ message: "Incorrect password." });
      }

      // Generate JWT
      const token = jwt.sign({ id: user.idUser }, secrecKey, {
        expiresIn: "1h",
      });

      try {
        if (user.infoDevice) {
          if (ip !== user.infoDevice) {
            const otp = sendOTP(email);
            const updateOTP = async () => {
              try {
                connectDB.query("UPDATE account SET otp = ? WHERE email = ?", [
                  otp,
                  email,
                ]);
                console.log("update otp 2FA ok");
              } catch (error) {
                return res.status(500).json({ message: "Can't update OTP" });
              }
            };
            updateOTP();
            is2FA = true;
            console.log(is2FA);
          } else {
            console.log(ip, user.infoDevice);
          }
        } else {
          const updateIpQuery =
            "UPDATE account SET infoDevice = ? WHERE idUser = ?";
          connectDB.query(updateIpQuery, [ip, user.idUser], (err) => {
            if (err) {
              console.error("Error updating IP:", err);
            } else {
              console.log("Updated IP:", ip);
            }
          });
        }

        console.log(is2FA);
        // Respond with token only if 2FA is not required
        if (!is2FA) {
          const token = jwt.sign({ id: user.idUser }, secrecKey, {
            expiresIn: "1h",
          });
          return res.json({
            message: "Login successful!",
            token,
            user: {
              id: user.idUser,
              email: user.email,
            },
          });
        } else {
          // Respond to client indicating that 2FA is required
          return res.json({
            message: "Two-factor authentication is required.",
            is2FA: true,
          });
        }
      } catch (error) {
        console.error("Error fetching IP:", error);
        return res.status(500).json({ message: "Unable to fetch IP address." });
      }
    });
  });
});

// Sign-Up API
routerLogin.post("/signup", (req, res) => {
  const { email, password, day, month, year, fullName, gender } = req.body;

  // Check if all fields are filled
  if (!fullName || !email || !password || !day || !month || !year || !gender) {
    return res.status(400).json({ message: "Please fill in all fields" });
  }

  // Parse birth date
  const birthStr = day + "-" + month + "-" + year;
  const birthDate = new Date(birthStr);

  // Check if the email already exists
  const queryCheckEmail = "SELECT * FROM account WHERE email = ?";
  connectDB.query(queryCheckEmail, [email], (err, result) => {
    if (err) throw err;

    if (result.length > 0) {
      return res.status(409).json({ message: "Email already exists" }); // 409 Conflict
    }

    // Hash the password
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) throw err;

      // Insert account into the database
      const queryInsert = "INSERT INTO account (email, password) VALUES (?, ?)";
      connectDB.query(queryInsert, [email, hash], (err, result) => {
        if (err) throw err;
        // Add info to the user table
        const userProfileQuery =
          "INSERT INTO user (fullName, gender, birthday ,idUser) VALUES (?,?,?, LAST_INSERT_ID())";
        connectDB.query(
          userProfileQuery,
          [fullName, gender, birthDate],
          (err, result) => {
            if (err) {
              console.error("Error inserting into user table:", err);

              // Delete account data if adding user fails
              const queryDeleteAccount =
                "DELETE FROM `account` WHERE idUser = LAST_INSERT_ID()";
              connectDB.query(queryDeleteAccount, (err) => {
                if (err) {
                  console.log("Delete account failed:", err);
                }
              });
              return res
                .status(500)
                .json({ message: "Error creating user profile." });
            }

            res.json({ message: "User signed up successfully!" });
          }
        );
      });
    });
  });
});

export default routerLogin;
