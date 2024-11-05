import express from "express";
import cors from "cors";
import routerLogin from "./Routes/authRoutes.js";
import routerHandlePassword from "./Routes/passwordRoutes.js";

const app = express();
const port = 7749;

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"], 
    allowedHeaders: ["Content-Type", "Authorization"], 
  })
);
app.use(express.json());

app.use("/", routerLogin);
app.use("/", routerHandlePassword);


app.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
});
