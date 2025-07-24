"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const userRoute_1 = __importDefault(require("./routes/userRoute"));
const courseRoute_1 = __importDefault(require("./routes/courseRoute"));
const coursePurchaseRoute_1 = __importDefault(require("./routes/coursePurchaseRoute"));
const courseProgressRoute_1 = __importDefault(require("./routes/courseProgressRoute"));
const dashboardRoute_1 = __importDefault(require("./routes/dashboardRoute"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const database_1 = require("./config/database");
const path_1 = __importDefault(require("path"));
const body_parser_1 = __importDefault(require("body-parser"));
const app = (0, express_1.default)();
const DIRNAME = path_1.default.resolve();
dotenv_1.default.config();
app.use(body_parser_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
const corsOptions = {
    origin: process.env.FRONTEND_URL,
    credentials: true
};
(0, database_1.connectDB)();
app.use((0, cors_1.default)(corsOptions));
app.use("/api/v1", userRoute_1.default);
app.use("/api/v1", courseRoute_1.default);
app.use("/api/v1", coursePurchaseRoute_1.default);
app.use("/api/v1", courseProgressRoute_1.default);
app.use("/api/v1", dashboardRoute_1.default);
exports.default = app;
