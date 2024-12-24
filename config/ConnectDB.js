import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const connectDB = mysql.createPool({
  host: "42.96.4.215",
  user: "dacs2",
  password: "dacs2",
  database: "dacs2",
  waitForConnections: true,
  connectionLimit: 100,
  queueLimit: 0,
});

// Test the connection
async function testDBConnection() {
  try {
    const [rows, fields] = await connectDB.execute("SELECT 1");
    console.log("Database connected successfully:", rows);
  } catch (err) {
    console.error("Error connecting to the database:", err.message);
  }
}

testDBConnection();

export default connectDB;