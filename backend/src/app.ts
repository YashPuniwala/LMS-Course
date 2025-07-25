import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import bodyParser from "body-parser";

import { connectDB } from "./config/database";

import user from "./routes/userRoute";
import course from "./routes/courseRoute";
import coursePurchase from "./routes/coursePurchaseRoute";
import courseProgress from "./routes/courseProgressRoute";
import dashboard from "./routes/dashboardRoute";
import review from "./routes/reviewRoute";

dotenv.config();

const app = express();
const DIRNAME = path.resolve();

// Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json());
app.use(cookieParser());

const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
};
app.use(cors(corsOptions));

connectDB()

// Routes
app.use("/api/v1", user);
app.use("/api/v1", course);
app.use("/api/v1", coursePurchase);
app.use("/api/v1", courseProgress);
app.use("/api/v1", dashboard);
app.use("/api/v1", review);

export default app;
