"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const isAuthenticated_1 = require("../middlewares/isAuthenticated");
const reviewController_1 = require("../controllers/reviewController");
const router = express_1.default.Router();
router.route("/create-review/:courseId").post(isAuthenticated_1.isAuthenticated, reviewController_1.createReview);
router.route("/update-review/:reviewId").put(isAuthenticated_1.isAuthenticated, reviewController_1.updateReview);
router.route("/delete-review/:reviewId").delete(isAuthenticated_1.isAuthenticated, reviewController_1.deleteReview);
router.route("/course-reviews/:courseId").get(isAuthenticated_1.isAuthenticated, reviewController_1.getCourseReviews);
router.route("/getUserReviewForCourses/:courseId").get(isAuthenticated_1.isAuthenticated, reviewController_1.getUserReviewForCourse);
exports.default = router;
