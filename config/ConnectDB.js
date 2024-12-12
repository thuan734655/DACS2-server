import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();
const uri =
  process.env.DB_URI ||
  "mysql://uibhubsgfu8zpu6y:EkiBxp1yjheHClDVhTQM@beeelnlvykq1ywgjbzbs-mysql.services.clever-cloud.com:3306/beeelnlvykq1ywgjbzbs";

const connectDB = mysql.createPool({
  uri,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});

export default connectDB;
