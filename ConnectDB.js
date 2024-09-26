const express = require("express");
const app = express();
const port = 3000;
const cors = require("cors");
const mysql = require("mysql");

// Middleware
app.use(cors()); // Chấp nhận kết nối từ React
app.use(express.json()); // Parse JSON từ React

// Kết nối MySQL
var connectDB = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", // Nếu có mật khẩu, thay thế chuỗi rỗng bằng mật khẩu của bạn
  database: "dacs2",
});

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

// Khởi động server
app.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
});
