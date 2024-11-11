// server.js
import express from "express";
import postRoutes from "./Routes/postRoutes.js";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";

const app = express();

// Middleware
app.use(
  cors({
    origin: "*", // Cho phép tất cả các nguồn
    methods: ["GET", "POST", "PUT", "DELETE"], // Các phương thức HTTP được cho phép
    allowedHeaders: ["Content-Type", "Authorization"], // Các headers được cho phép
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cấu hình để phục vụ file upload
app.use("/images", express.static(path.join(__dirname, "images")));

// Sử dụng các routes cho bài viết
app.use("/api", postRoutes);

// Khởi động server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
