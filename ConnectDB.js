import mysql from "mysql";

// Kết nối MySQL
var connectDB = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", 
  database: "dacs2",
});

connectDB.connect(function (err) {
  if (err) {
    console.error("Error connecting to MySQL: ", err);
    return;
  }
  console.log("Connected to MySQL!");
});

export default connectDB;
