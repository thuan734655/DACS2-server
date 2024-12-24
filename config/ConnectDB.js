import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const connectDB = mysql.createPool({
  host: '42.96.4.215',         // Địa chỉ của máy chủ MySQL
  user: 'dacs2',               // Tên người dùng MySQL
  password: 'dacs2',           // Mật khẩu kết nối MySQL
  database: 'dacs2',           // Tên cơ sở dữ liệu
  waitForConnections: true,
  connectionLimit: 100,
  queueLimit: 0
});

// Test the connection
async function testDBConnection() {
  try {
    const [rows, fields] = await connectDB.execute('SELECT 1');
    console.log('Database connected successfully:', rows);
  } catch (err) {
    console.error('Error connecting to the database:', err.message);
  }
}

testDBConnection();

export default connectDB;