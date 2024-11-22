import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { fileURLToPath } from "url";
import path from "path";
import handleSocketEvents from "./websocket/wsServer.js";
import postRoutes from "./Routes/postRoutes.js";
import userRoutes from "./Routes/userRouter.js";
import routerLogin from "./Routes/authRoutes.js";

const app = express();

// Tạo server HTTP
const server = http.createServer(app);

// Khởi tạo socket.io
const io = new Server(server, {
  cors: {
    origin: "*", // Cho phép tất cả các origin
    methods: ["GET", "POST", "PUT", "DELETE"], // Các phương thức HTTP được phép
  },
});

// Xử lý các sự kiện WebSocket
io.on("connection", (socket) => {
  handleSocketEvents(socket, io); // Truyền `socket` và `io` vào hàm xử lý sự kiện
});

// Cấu hình middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up static file serving cho hình ảnh
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/images", express.static(path.join(__dirname, "images")));

app.use("/api", postRoutes);
app.use("/api", userRoutes);
app.use("/", routerLogin);

// Lắng nghe trên cổng 5000
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
