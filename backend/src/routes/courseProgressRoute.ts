import express, { Request, Response, NextFunction } from "express";
import { isAdmin, isAuthenticated } from "../middlewares/isAuthenticated";
import { getCourseProgress, markAsCompleted, markAsInCompleted, updateLectureProgress } from "../controllers/courseProgressController";

const router = express.Router();

router.route("/getCourseProgress/:courseId").get(isAuthenticated, getCourseProgress);
router.route("/update/view/:courseId/:lectureId/:subLectureId").post(isAuthenticated, updateLectureProgress);
router.route("/markAsCompleted/:courseId").post(isAuthenticated, markAsCompleted)
router.route("/markAsInCompleted/:courseId").post(isAuthenticated, markAsInCompleted)

export default router;