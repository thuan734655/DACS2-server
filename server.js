import express from "express";
import cors from "cors";
import routerLogin from "./Routes/authRoutes.js";
import routerHandlePassword from "./Routes/passwordRoutes.js";
import routerUser from "./Routes/userRouter.js";
import http from "http";
import { Server } from "socket.io";
// Kết nối MySQL
import connectDB from "./config/ConnectDB.js";


const app = express();
const port = 7749;

// Middleware
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Socket.IO setup
io.on("connectDB", (socket) => {
  console.log("A user connected:", socket.idUser);

  // Add user ID mapping
  socket.on("register", (userId) => {
    socket.userId = userId;
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.idUser);
  });
});

// API Routes
app.use("/", routerLogin);
app.use("/", routerHandlePassword);
app.use("/", routerUser);
const router = express.Router();
router.get("/api/conversations/partner/:currentUserId", async (req, res) => {
  try {
    const currentUserId = parseInt(req.params.currentUserId, 10);
    if (isNaN(currentUserId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const [conversations] = await connectDB.query(
      `SELECT CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END AS partnerId FROM conversations WHERE sender_id = ? OR receiver_id = ? ORDER BY created_at DESC LIMIT 1`,
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
app.use("/", router);

// Start server
server.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
});
