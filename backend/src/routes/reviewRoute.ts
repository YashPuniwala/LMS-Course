import express from "express";
import { createCourse, createLecture, createSubLecture, editCourse, editLecture, editSubLecture, getAllAdminCourses, getCourseById, getCourseLecture, getLectureById, getPublishedCourse, getSingleLectureSubLectures, removeCourse, removeLecture, removeSubLecture, searchCourse, togglePublicCourse } from "../controllers/courseController";
import { isAdmin, isAuthenticated } from "../middlewares/isAuthenticated";
import upload from "../utils/multer";
import { createReview, deleteReview, getCourseReviews, getUserReviewForCourse, updateReview } from "../controllers/reviewController";

const router = express.Router();

router.route("/create-review/:courseId").post(isAuthenticated, createReview)
router.route("/update-review/:reviewId").put(isAuthenticated, updateReview)
router.route("/delete-review/:reviewId").delete(isAuthenticated, deleteReview)
router.route("/course-reviews/:courseId").get(isAuthenticated, getCourseReviews)
router.route("/getUserReviewForCourses/:courseId").get(isAuthenticated, getUserReviewForCourse)

export default router;