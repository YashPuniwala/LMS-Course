"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = exports.isAuthenticated = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const userModel_1 = require("../models/userModel");
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
exports.isAuthenticated = (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let token = req.cookies.token;
        console.log(token, "token authenticate");
        console.log(req.cookies, "req.cookies authenticate");
        if (!token) {
            return next(new errorHandler_1.default("Token not found", 400));
        }
        const jwtSecret = process.env.JWT_SECRET_KEY || "";
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        if (!decoded || !decoded.userId) {
            return next(new errorHandler_1.default("UserId not found", 401));
        }
        const user = yield userModel_1.User.findById(decoded.userId).select("_id name email role photoUrl enrolledCourses");
        if (!user) {
            return next(new errorHandler_1.default("User not found", 401));
        }
        // Set req.user to the full user object
        req.user = user;
        console.log(req.user, "req.user in isAuthenticated");
        next();
    }
    catch (e) {
        res.status(401).json({ message: "Invalid Token" });
        next(e);
    }
}));
const isAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("req.user.admin:", req.user); // Debug log
    console.log("req.user.admin:", (_a = req.user) === null || _a === void 0 ? void 0 : _a.role); // Debug log
    if (!req.user || req.user.role !== "instructor") {
        return next(new errorHandler_1.default("Unauthorized access", 400));
    }
    console.log(req.user);
    console.log(req.user.role);
    next();
});
exports.isAdmin = isAdmin;
