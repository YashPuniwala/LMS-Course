import express from "express";
import { createCourse, createLecture, createSubLecture, editCourse, editLecture, editSubLecture, getAllAdminCourses, getCourseById, getCourseLecture, getLectureById, getPublishedCourse, getSingleLectureSubLectures, removeCourse, removeLecture, removeSubLecture, searchCourse, togglePublicCourse } from "../controllers/courseController";
import { isAdmin, isAuthenticated } from "../middlewares/isAuthenticated";
import upload from "../utils/multer";
import { getDashboardMetrics } from "../controllers/dashboardController";

const router = express.Router();

router.route("/get-dashboard-metrice").get(isAuthenticated, isAdmin, getDashboardMetrics)

export default router;