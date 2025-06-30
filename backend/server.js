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
const server = http.createServer(app); // tạo serverserver HTTP

const io = new Server(server, {
  cors: {
    origin: "http://localhost:51733", // Update to match frontend port
    credentials: true,
  },
});

app.use(
  cors({
    origin: "http://localhost:5173", // Update to match frontend port
    credentials: true,
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
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Socket.IO ready for real-time connections`);
});
