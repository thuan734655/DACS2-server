import routerLogin from "./Router/login.js";
import express from "express";
import cors from "cors";
import connectDB from "./ConnectDB.js";
import routerHandlePassword from "./Router/HandlePassword.js";
const app = express();
const port = 7749;

connectDB.connect(function (err) {
  if (err) {
    console.error("Error connecting to MySQL: ", err);
    return;
  }
  console.log("Connected to MySQL!");
});

// Middleware
app.use(
  cors({
    origin: "*", // Cho phép tất cả các nguồn
    methods: ["GET", "POST", "PUT", "DELETE"], // Các phương thức HTTP được cho phép
    allowedHeaders: ["Content-Type", "Authorization"], // Các headers được cho phép
  })
);

app.use("/", routerLogin);
app.use("/", routerHandlePassword);


// Khởi động server
app.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
});
