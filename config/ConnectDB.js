import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const connectDB = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "dacs2",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default connectDB;
