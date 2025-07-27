import { Router } from "express";
import authRoutes from "./auth.js";
import postRoutes from "./post.js";
import messageRoute from "./message.js";
import userRoute from "./user.js";
import friendAuth from "./friend.js";

const routes = Router();

routes.use("/auth", authRoutes);
routes.use("/posts", postRoutes);
routes.use("/message", messageRoute);
routes.use("/user", userRoute);
routes.use("/friend", friendAuth);
export default routes;
