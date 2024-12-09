import mysql from "mysql2/promise";

const connectDB = mysql.createPool({
  uri: "mysql://uibhubsgfu8zpu6y:EkiBxp1yjheHClDVhTQM@beeelnlvykq1ywgjbzbs-mysql.services.clever-cloud.com:3306/beeelnlvykq1ywgjbzbs",
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});

// Hàm kiểm tra kết nối
async function testDatabaseConnection() {
  try {
    const connection = await connectDB.getConnection(); // Lấy một kết nối từ pool
    console.log("Database connection successful!");
    connection.release(); // Giải phóng kết nối sau khi kiểm tra
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1); // Thoát ứng dụng nếu kết nối thất bại
  }
}

// Gọi hàm kiểm tra khi load file
testDatabaseConnection();

export default connectDB;
