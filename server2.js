import express from "express";
import postRoutes from "./Routes/postRoutes.js";
import userRoutes from "./Routes/userRouter.js";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";
import http from "http"; // Add http for creating server
import { Server } from "socket.io"; // Use Server from socket.io

const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize socket.io
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
  },
});

// Middleware
app.use(
  cors({
    origin: "*", // Allow all origins
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Listen for new comment event
  socket.on("newComment", async ({ postId, comment }) => {
    try {
      // Update comment in database
      await Post.addComment(postId, comment);
      // Emit event to all clients for the new comment
      io.emit("receiveComment", { postId, comment });
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  });

  // Listen for new reaction event
  socket.on("newReaction", async ({ postId, emoji }) => {
    try {
      // Update reaction in database
      await Post.addReaction(postId, emoji);
      // Emit event to all clients for the new reaction
      io.emit("receiveReaction", { postId, emoji });
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  });

  // Handle socket disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Set up static file serving for uploaded images
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/images", express.static(path.join(__dirname, "images")));

// API Routes for posts and users
app.use("/api", postRoutes); // Use "/api/posts" specifically for post routes
app.use("/api", userRoutes); // Use "/api/users" for user routes

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  // Run HTTP server instead of app.listen
  console.log(`Server running on port ${PORT}`);
});
