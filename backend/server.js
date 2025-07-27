import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser"; // Import cookie-parser
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import routes from "./src/routes/index.js";
import { socketController } from "./src/controllers/socketController.js";
import { setSocketIO } from "./src/controllers/FriendAndNoficationController.js";
import { Server } from "socket.io";
import http from "http";

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
    ],
    credentials: true,
    methods: ["GET", "POST"],
  },
});

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(bodyParser.json());
app.use(cookieParser());

// Routes
app.use("/api", routes);

// Pass socket.io instance to controllers
setSocketIO(io);

// Gọi socket controller
socketController(io);

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO ready for real-time connections`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
});
