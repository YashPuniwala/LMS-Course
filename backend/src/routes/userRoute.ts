import express, { Request, Response, NextFunction } from "express";
import { getUserProfile, login, logout, register, updateProfile } from "../controllers/userController";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import upload from "../utils/multer";

const router = express.Router();

router.route("/register").post(register)
router.route("/login").post(login)
router.route("/logout").post(logout)
router.route("/me").get(isAuthenticated, getUserProfile)
router.route("/profile/update").put(isAuthenticated, upload.single("profilePhoto"), updateProfile);

export default router;