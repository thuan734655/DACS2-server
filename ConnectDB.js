const express = require("express");
const app = express();
const port = 7749;
const cors = require("cors");
const mysql = require("mysql");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const e = require("express");

// Middleware
app.use(
  cors({
    origin: "*", // Cho phép tất cả các nguồn
    methods: ["GET", "POST", "PUT", "DELETE"], // Các phương thức HTTP được cho phép
    allowedHeaders: ["Content-Type", "Authorization"], // Các headers được cho phép
  })
);
app.use(express.json()); // Parse JSON từ React
app.use(bodyParser.json()); // Parse JSON
app.use(bodyParser.urlencoded({ extended: true }));

// Kết nối MySQL
var connectDB = mysql.createConnection({
  host: "localhost",
  user: "root",

  password: "", // Nếu có mật khẩu, thay thế chuỗi rỗng bằng mật khẩu của bạn
  database: "dacs2",
});

const secrecKey =
  "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.VFb0qJ1LRg_4ujbZoRMXnVkUgiuKq5KxWqNdbKq_G9Vvz-S1zZa9LPxtHWKa64zDl2ofkT8F6jBt_K4riU-fPg"; // Thay thế với secret key của bạn

connectDB.connect(function (err) {
  if (err) {
    console.error("Error connecting to MySQL: ", err);
    return;
  }
  console.log("Connected to MySQL!");
});

// Route mẫu để kiểm tra kết nối
app.get("/", (req, res) => {
  res.send("Server is running and connected to MySQL!");
});

// API đăng nhập
app.post("/login", async (req, res) => { 
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

      // Tạo JWT
      const token = jwt.sign({ id: user.idUser }, secrecKey, {
        expiresIn: "1h",
      });

      try {
        if (user.is2FAEnable) {
          if (ip !== user.is2FAEnable) {
            is2FA = true;
          } else {
            console.log(ip, user.is2FAEnable);
          }
        } else {
          const updateIpQuery =
            "UPDATE account SET is2FAEnable = ? WHERE idUser = ?";
          connectDB.query(updateIpQuery, [ip, user.idUser], (err) => {
            if (err) {
              console.error("Error updating IP:", err);
            } else {
              console.log("Updated IP:", ip);
            }
          });
        }

        res.json({
          message: "Login successful!",
          token,
          user: {
            id: user.idUser,
            email: user.email,
          },
          ip: ip,
          is2FA: is2FA
        });
      } catch (error) {
        console.error("Error fetching IP:", error);
        return res.status(500).json({ message: "Unable to fetch IP address." });
      }
    });
  });
});

// API Sign-Up
app.post("/signup", (req, res) => {
  const { email, password, day, month, year, fullName, gender } = req.body;

  // Check if all fields are filled
  if (!fullName || !email || !password || !day || !month || !year || !gender) {
    return res.status(400).json({ message: "Please fill in all fields" });
  }

  //parse birth
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
        //add info table user
        const userProfileQuery =
          "INSERT INTO user (fullName, gender, birthday ,idUser) VALUES (?,?,?, LAST_INSERT_ID())";
        connectDB.query(
          userProfileQuery,
          [fullName, gender, birthDate],
          (err, result) => {
            if (err) {
              console.error("Error inserting into user table:", err);

              //delete data account if add user is fail
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

// Khởi động server
app.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
});
