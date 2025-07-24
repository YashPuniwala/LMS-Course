"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const isAuthenticated_1 = require("../middlewares/isAuthenticated");
const courseProgressController_1 = require("../controllers/courseProgressController");
const router = express_1.default.Router();
router.route("/getCourseProgress/:courseId").get(isAuthenticated_1.isAuthenticated, courseProgressController_1.getCourseProgress);
router.route("/update/view/:courseId/:lectureId/:subLectureId").post(isAuthenticated_1.isAuthenticated, courseProgressController_1.updateLectureProgress);
router.route("/markAsCompleted/:courseId").post(isAuthenticated_1.isAuthenticated, courseProgressController_1.markAsCompleted);
router.route("/markAsInCompleted/:courseId").post(isAuthenticated_1.isAuthenticated, courseProgressController_1.markAsInCompleted);
exports.default = router;
