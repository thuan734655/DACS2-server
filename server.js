import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { fileURLToPath } from "url";
import path from "path";
import handleSocketEvents from "./websocket/wsServer.js";
import routerLogin from "./Routes/authRoutes.js";
import routerHandlePassword from "./Routes/passwordRoutes.js";
import routerUser from "./Routes/userRouter.js";
import postRoutes from "./Routes/postRoutes.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 5000;
const app = express();
// Middleware configuration
app.use(
  cors({
    origin: "*", // Allow all origins
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
  },
  maxHttpBufferSize: 10 * 1024 * 1024, // Max buffer size for large payloads
});

// Handle WebSocket events
io.on("connection", (socket) => {
 

  // Add user ID mapping
  socket.on("register", (userId) => {
    socket.userId = userId;
  ;
  });

  // Handle disconnection
  socket.on("disconnect", () => {
  
  });

  // Delegate custom events to external handler
  handleSocketEvents(socket, io);
});
const onlineUsers = new Map();

// Hàm lấy danh sách userId của người dùng đang online
const getAllOnlineUsers = () => {
  const users = Array.from(onlineUsers.values());
  console.log('Danh sách người dùng online hiện tại:', users);
  return users;
};

// Handle WebSocket events
io.on("connection", (socket) => {
  console.log("Có người dùng kết nối, socket ID:", socket.id);

  // Add user ID mapping
  socket.on("register", (userId) => {
    socket.userId = userId;
  });

  // Khi user kết nối và đăng nhập
  socket.on('userConnected', (userId) => {
    console.log(`User ${userId} đã kết nối với socket ID ${socket.id}`);
    // Lưu socket.id và userId
    socket.userId = userId;
    onlineUsers.set(socket.id, userId);
    
    // Log theo nhiều cách khác nhau để debug
    console.log('Map size:', onlineUsers.size);
    console.log('Map entries:', [...onlineUsers.entries()]);
    console.log('Socket IDs:', [...onlineUsers.keys()]);
    console.log('User IDs:', [...onlineUsers.values()]);

    // Gửi danh sách users online cho tất cả clients
    const onlineList = getAllOnlineUsers();
    console.log('Gửi danh sách online cho clients:', onlineList);
    io.emit('getOnlineUsers', onlineList);
    
    // Thông báo user mới online
    socket.broadcast.emit('userConnected', userId);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    if (socket.userId) {
      console.log(`User ${socket.userId} đã ngắt kết nối`);
      // Xóa khỏi danh sách online và thông báo
      onlineUsers.delete(socket.id);
      console.log('Danh sách online sau khi xóa:', Array.from(onlineUsers.values()));
      socket.broadcast.emit('userDisconnected', socket.userId);
    }
  });

  // Delegate custom events to external handler
  handleSocketEvents(socket, io);
});
// Set up static file serving cho hình ảnh
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/images", express.static(path.join(__dirname, "images")));

app.use("/", routerLogin);
app.use("/", routerHandlePassword);
app.use("/api", routerUser);
app.use("/api", postRoutes);
// Route for fetching conversation partner
app.get("/api/conversations/partner/:currentUserId", async (req, res) => {
  try {
    const currentUserId = parseInt(req.params.currentUserId, 10);
    if (isNaN(currentUserId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const [conversations] = await connectDB.query(
      `SELECT CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END AS partnerId 
       FROM conversations 
       WHERE sender_id = ? OR receiver_id = ? 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [currentUserId, currentUserId, currentUserId]
    );

    if (conversations.length > 0) {
      const partnerId = conversations[0].partnerId;

      const [users] = await connectDB.query(
        "SELECT idUser, fullName FROM user WHERE idUser = ?",
        [partnerId]
      );

      if (users.length > 0) {
        res.json({
          data: {
            idUser: users[0].idUser,
            fullName: users[0].fullName,
          },
        });
      } else {
        res.status(404).json({ message: "Partner not found" });
      }
    } else {
      res.status(404).json({ message: "No recent conversation found" });
    }
  } catch (error) {
    console.error("Error fetching conversation partner:", error);
    res.status(500).json({
      message: "Error fetching conversation partner",
      error: error.message,
    });
  }
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
