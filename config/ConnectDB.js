import mysql from 'mysql2/promise';

const connectDB = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "dacs2",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default connectDB;