"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const courseController_1 = require("../controllers/courseController");
const isAuthenticated_1 = require("../middlewares/isAuthenticated");
const multer_1 = __importDefault(require("../utils/multer"));
const router = express_1.default.Router();
router.route("/create-course").post(isAuthenticated_1.isAuthenticated, isAuthenticated_1.isAdmin, multer_1.default.single("videoFile"), courseController_1.createCourse);
router.route("/search").get(courseController_1.searchCourse);
router.route("/courses").get(isAuthenticated_1.isAuthenticated, courseController_1.getAllAdminCourses);
router.route("/remove-course/:courseId").delete(isAuthenticated_1.isAuthenticated, courseController_1.removeCourse);
router.route("/getCourseById/:courseId").get(isAuthenticated_1.isAuthenticated, isAuthenticated_1.isAdmin, courseController_1.getCourseById);
router.route("/courses/:courseId").put(isAuthenticated_1.isAuthenticated, isAuthenticated_1.isAdmin, multer_1.default.fields([
    { name: "courseThumbnail", maxCount: 1 },
    { name: "tutorialVideo", maxCount: 1 }
]), courseController_1.editCourse);
router.route("/create-lecture/:courseId").post(isAuthenticated_1.isAuthenticated, isAuthenticated_1.isAdmin, courseController_1.createLecture);
router.route("/create-subLecture/:lectureId").post(isAuthenticated_1.isAuthenticated, isAuthenticated_1.isAdmin, multer_1.default.single("videoFile"), courseController_1.createSubLecture);
router.route("/getSubLectures/:lectureId").get(isAuthenticated_1.isAuthenticated, courseController_1.getSingleLectureSubLectures);
router.route("/getCourseLecture/:courseId").get(isAuthenticated_1.isAuthenticated, isAuthenticated_1.isAdmin, courseController_1.getCourseLecture);
router.route("/lectures/:courseId/:lectureId").put(isAuthenticated_1.isAuthenticated, isAuthenticated_1.isAdmin, courseController_1.editLecture);
router.route("/subLectures/:lectureId/:subLectureId").put(isAuthenticated_1.isAuthenticated, isAuthenticated_1.isAdmin, multer_1.default.single("videoFile"), courseController_1.editSubLecture);
router.route("/remove-lecture/:lectureId").delete(isAuthenticated_1.isAuthenticated, isAuthenticated_1.isAdmin, courseController_1.removeLecture);
router.route("/remove-subLecture/:lectureId/:subLectureId").delete(isAuthenticated_1.isAuthenticated, isAuthenticated_1.isAdmin, courseController_1.removeSubLecture);
router.route("/getLectureById/:lectureId").get(isAuthenticated_1.isAuthenticated, isAuthenticated_1.isAdmin, courseController_1.getLectureById);
router.route("/publish-course/:courseId").patch(isAuthenticated_1.isAuthenticated, isAuthenticated_1.isAdmin, courseController_1.togglePublicCourse);
router.route("/getPublishedCourse").get(courseController_1.getPublishedCourse);
exports.default = router;
