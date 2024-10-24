import express from "express";
import cors from "cors";
import routerLogin from "./Routes/authRoutes.js";
import routerHandlePassword from "./Routes/passwordRoutes.js";
// import updateAccountRoute from "./Routes/updateAccountRoute.js";
const app = express();
const port = 7749;

// Middleware
app.use(
  cors({
    origin: "*", // Cho phép tất cả các nguồn
    methods: ["GET", "POST", "PUT", "DELETE"], // Các phương thức HTTP được cho phép
    allowedHeaders: ["Content-Type", "Authorization"], // Các headers được cho phép
  })
);
app.use(express.json());

app.use("/", routerLogin);
app.use("/", routerHandlePassword);
// app.use("/",updateAccountRoute);

// Khởi động server
app.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
});
