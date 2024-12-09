import mysql from "mysql2/promise";

const connectDB = mysql.createPool({
  // host: "localhost",
  // user: "root",
  // password: "",
  // database: "dacs2",
  // waitForConnections: true,
  // connectionLimit: 10,
  // queueLimit: 0

  host: "beeelnlvykq1ywgjbzbs-mysql.services.clever-cloud.com",
  user: "uibhubsgfu8zpu6y",
  password: "EkiBxp1yjheHClDVhTQM",
  database: "beeelnlvykq1ywgjbzbs",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default connectDB;
