import { CoursePurchase } from './models/coursePurchaseModel';
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import user from "./routes/userRoute"
import course from "./routes/courseRoute"
import coursePurchase from "./routes/coursePurchaseRoute"
import courseProgress from "./routes/courseProgressRoute"
import dashboard from "./routes/dashboardRoute"
import review from "./routes/reviewRoute"
import cookieParser from "cookie-parser";
import { connectDB } from "./config/database";
import path from "path"
import bodyParser from 'body-parser';

const app = express();
const DIRNAME = path.resolve()

dotenv.config();

app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json());
app.use(cookieParser());

const startServer = async () => {
  try {
    await connectDB();

    if (process.env.NODE_ENV !== "production") {
      app.listen(process.env.PORT, () =>
        console.log("Server is up and running on PORT:5001")
      );
    }
  } catch (error: any) {
    console.error("Failed to start server", error.message);
    process.exit(1);
  }
};

startServer()

const corsOptions = {
    origin: process.env.FRONTEND_URL,
    credentials: true
}
connectDB();

app.use(cors(corsOptions));

app.use("/api/v1", user);
app.use("/api/v1", course);
app.use("/api/v1", coursePurchase);
app.use("/api/v1", courseProgress);
app.use("/api/v1", dashboard);
app.use("/api/v1", review);

export default app;