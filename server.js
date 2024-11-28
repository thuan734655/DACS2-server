import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { fileURLToPath } from "url";
import path from "path";

// Import route handlers
import routerLogin from "./Routes/authRoutes.js";
import routerHandlePassword from "./Routes/passwordRoutes.js";
import postRoutes from "./Routes/postRoutes.js";
import userRoutes from "./Routes/userRouter.js";

// Import WebSocket handler
import handleSocketEvents from "./websocket/wsServer.js";

const app = express();
const PORT = process.env.PORT || 5000;

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
  handleSocketEvents(socket, io); // Pass `socket` and `io` to event handler
});

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

// Static file serving for images
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/images", express.static(path.join(__dirname, "images")));

// API routes
app.use("/api", postRoutes);
app.use("/api", userRoutes);
app.use("/", routerLogin);
app.use("/", routerHandlePassword);

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
