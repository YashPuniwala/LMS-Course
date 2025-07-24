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
exports.updateProfile = exports.getUserProfile = exports.logout = exports.login = exports.register = void 0;
const userModel_1 = require("../models/userModel");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const generateToken_1 = require("../utils/generateToken");
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const cloudinary_1 = require("../utils/cloudinary");
const register = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password } = req.body;
        // Check for missing fields
        if (!name || !email || !password) {
            res.status(400).json({ message: "Please enter all fields" });
            return; // Prevent further execution
        }
        // Check if the user already exists
        const userExists = yield userModel_1.User.findOne({ email });
        if (userExists) {
            res.status(400).json({ success: false, message: "User already exists" });
            return; // Prevent further execution
        }
        // Create the user if validation passes
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
        const user = yield userModel_1.User.create({
            name,
            email,
            password: hashedPassword,
        });
        if (user) {
            (0, generateToken_1.generateToken)(res, user, user._id, "Registered Successfully", 201);
            res.status(200).json({ userId: user._id });
        }
        else {
            // Handle case where user creation fails
            return next(new errorHandler_1.default("An error occurred in creating the user", 400));
        }
    }
    catch (error) {
        // Pass any unexpected errors to the error handler
        next(error);
    }
});
exports.register = register;
const login = (req, // Typing request body
res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({
                success: false,
                message: "All fields are required",
            });
            return;
        }
        const user = yield userModel_1.User.findOne({ email });
        if (!user) {
            res.status(400).json({
                success: false,
                message: "Incorrect email or password",
            });
            return;
        }
        const isPasswordMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordMatch) {
            res.status(400).json({
                success: false,
                message: "Incorrect email or password",
            });
            return;
        }
        (0, generateToken_1.generateToken)(res, user, user._id.toString(), `Welcome back ${user.name}`, 201);
    }
    catch (error) {
        next(error);
    }
});
exports.login = login;
const logout = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.cookie("token", "", {
            expires: new Date(0),
            httpOnly: true,
        });
        res.status(200).json({
            success: true,
            message: "Logged out successfully!",
        });
    }
    catch (error) {
        console.error("Logout Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to log out. Please try again.",
        });
    }
});
exports.logout = logout;
const getUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user; // Get user ID from req.user
        console.log(userId, "userId");
        console.log(req.user, "req.user");
        if (!userId) {
            res.status(404).json({ message: "User ID not found in request" });
        }
        console.log(userId, "userId");
        const user = yield userModel_1.User.findById(userId).select("-password").populate("enrolledCourses");
        if (!user) {
            res.status(404).json({ success: false, message: "User not found" });
        }
        console.log(user, "user");
        res.json(user);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch user profile"
        });
    }
});
exports.getUserProfile = getUserProfile;
const updateProfile = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = req.user;
        const { name } = req.body;
        const profilePhoto = req.file;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized: No user ID found",
            });
            return;
        }
        const user = yield userModel_1.User.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }
        if (user && user.photoUrl) {
            const publicId = (_a = user.photoUrl.split("/").pop()) === null || _a === void 0 ? void 0 : _a.split(".")[0];
            if (publicId) {
                yield (0, cloudinary_1.deleteMediaFromCloudinary)(publicId);
            }
        }
        let photoUrl;
        if (profilePhoto && profilePhoto.path) {
            const cloudResponse = yield (0, cloudinary_1.uploadMedia)(profilePhoto.path);
            photoUrl = cloudResponse === null || cloudResponse === void 0 ? void 0 : cloudResponse.secure_url;
        }
        const updatedData = {
            name: name || user.name,
            photoUrl: photoUrl || user.photoUrl,
        };
        const updatedUser = yield userModel_1.User.findByIdAndUpdate(userId, updatedData, {
            new: true,
        }).select("-password");
        res.status(200).json({
            success: true,
            user: updatedUser,
            message: "Profile updated successfully.",
        });
        return;
    }
    catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update the profile.",
        });
    }
});
exports.updateProfile = updateProfile;
