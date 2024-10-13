import mysql from "mysql";
// Kết nối MySQL
const connectDB = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "dacs2",
});

export default connectDB;
