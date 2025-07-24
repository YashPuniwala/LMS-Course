import express from "express";
import { createCourse, createLecture, createSubLecture, editCourse, editLecture, editSubLecture, getAllAdminCourses, getCourseById, getCourseLecture, getLectureById, getPublishedCourse, getSingleLectureSubLectures, removeCourse, removeLecture, removeSubLecture, searchCourse, togglePublicCourse } from "../controllers/courseController";
import { isAdmin, isAuthenticated } from "../middlewares/isAuthenticated";
import upload from "../utils/multer";

const router = express.Router();

router.route("/create-course").post(isAuthenticated, isAdmin, upload.single("videoFile"), createCourse)
router.route("/search").get(searchCourse);
router.route("/courses").get(isAuthenticated, getAllAdminCourses)
router.route("/remove-course/:courseId").delete(isAuthenticated, removeCourse)
router.route("/getCourseById/:courseId").get(isAuthenticated, isAdmin, getCourseById)
router.route("/courses/:courseId").put(
    isAuthenticated,
    isAdmin,
    upload.fields([
      { name: "courseThumbnail", maxCount: 1 },
      { name: "tutorialVideo", maxCount: 1 }
    ]),
    editCourse
  );
router.route("/create-lecture/:courseId").post(isAuthenticated, isAdmin, createLecture)
router.route("/create-subLecture/:lectureId").post(isAuthenticated, isAdmin, upload.single("videoFile"), createSubLecture)
router.route("/getSubLectures/:lectureId").get(isAuthenticated, getSingleLectureSubLectures)
router.route("/getCourseLecture/:courseId").get(isAuthenticated, isAdmin, getCourseLecture)
router.route("/lectures/:courseId/:lectureId").put(isAuthenticated, isAdmin, editLecture);
router.route("/subLectures/:lectureId/:subLectureId").put(isAuthenticated, isAdmin, upload.single("videoFile"), editSubLecture);
router.route("/remove-lecture/:lectureId").delete(isAuthenticated, isAdmin, removeLecture)
router.route("/remove-subLecture/:lectureId/:subLectureId").delete(isAuthenticated, isAdmin, removeSubLecture)
router.route("/getLectureById/:lectureId").get(isAuthenticated, isAdmin, getLectureById)
router.route("/publish-course/:courseId").patch(isAuthenticated, isAdmin, togglePublicCourse)
router.route("/getPublishedCourse").get(getPublishedCourse)

export default router;