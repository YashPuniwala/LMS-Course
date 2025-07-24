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
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAsInCompleted = exports.markAsCompleted = exports.updateLectureProgress = exports.getCourseProgress = void 0;
const courseProgressModel_1 = require("../models/courseProgressModel");
const courseModel_1 = require("../models/courseModel");
const calculateProgressPercentage = (courseProgress, course) => {
    if (!course || !course.lectures)
        return 0;
    // Calculate total sub-lectures in the course
    const totalSubLectures = course.lectures.reduce((count, lecture) => {
        var _a;
        return count + (((_a = lecture.subLectures) === null || _a === void 0 ? void 0 : _a.length) || 0);
    }, 0);
    if (totalSubLectures === 0)
        return 0;
    // Calculate completed sub-lectures
    const completedSubLectures = courseProgress.lectureProgress.reduce((count, lecture) => {
        return count + lecture.subLectureProgress.filter((sub) => sub.viewed).length;
    }, 0);
    // Calculate percentage
    const progressPercentage = Math.round((completedSubLectures / totalSubLectures) * 100);
    return progressPercentage;
};
const getCourseProgress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { courseId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        let courseProgress = yield courseProgressModel_1.CourseProgress.findOne({ courseId, userId })
            .populate({
            path: "courseId",
            populate: { path: "lectures", populate: { path: "subLectures" } },
        });
        const courseDetails = yield courseModel_1.Course.findById(courseId).populate({
            path: "lectures",
            populate: { path: "subLectures" },
        });
        if (!courseDetails) {
            res.status(404).json({ success: false, message: "Course not found!" });
            return;
        }
        if (!courseProgress) {
            res.status(200).json({
                data: { courseDetails, progress: [], completed: false, progressPercentage: 0 }, // Default to 0 if no progress exists
            });
            return;
        }
        res.status(200).json({
            data: {
                courseDetails,
                progress: courseProgress.lectureProgress,
                completed: courseProgress.completed,
                progressPercentage: courseProgress.progressPercentage, // Ensure this is returned
            },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});
exports.getCourseProgress = getCourseProgress;
const updateLectureProgress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { courseId, lectureId, subLectureId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        let courseProgress = yield courseProgressModel_1.CourseProgress.findOne({ courseId, userId });
        if (!courseProgress) {
            courseProgress = new courseProgressModel_1.CourseProgress({
                userId,
                courseId,
                completed: false,
                lectureProgress: [],
                progressPercentage: 0, // Initialize progress percentage
            });
        }
        // Find lecture inside courseProgress
        let lectureProgress = courseProgress.lectureProgress.find((lecture) => lecture.lectureId === lectureId);
        if (!lectureProgress) {
            lectureProgress = { lectureId, viewed: false, subLectureProgress: [] };
            courseProgress.lectureProgress.push(lectureProgress);
        }
        // Find sub-lecture inside lectureProgress
        let subLectureProgress = lectureProgress.subLectureProgress.find((sub) => sub.subLectureId === subLectureId);
        if (!subLectureProgress) {
            subLectureProgress = { subLectureId, viewed: true };
            lectureProgress.subLectureProgress.push(subLectureProgress);
        }
        else {
            subLectureProgress.viewed = true;
        }
        // Check if all sub-lectures are completed for this lecture
        const course = yield courseModel_1.Course.findById(courseId).populate({
            path: "lectures",
            populate: { path: "subLectures" },
        });
        if (course) {
            // Find the current lecture in the course
            const currentLecture = course.lectures.find((lecture) => {
                var _a;
                return ((_a = lecture._id) === null || _a === void 0 ? void 0 : _a.toString()) === lectureId;
            });
            if (currentLecture) {
                const typedLecture = currentLecture;
                const totalLectureSubLectures = ((_b = typedLecture.subLectures) === null || _b === void 0 ? void 0 : _b.length) || 0;
                const completedLectureSubLectures = lectureProgress.subLectureProgress.filter((sub) => sub.viewed).length;
                // Mark lecture as viewed if all sub-lectures are viewed
                if (totalLectureSubLectures > 0 && completedLectureSubLectures === totalLectureSubLectures) {
                    lectureProgress.viewed = true;
                }
            }
            // Calculate progress percentage
            courseProgress.progressPercentage = calculateProgressPercentage(courseProgress, course);
            // Check course completion status
            const totalSubLectures = course.lectures.reduce((count, lecture) => {
                var _a;
                const lectureData = lecture;
                return count + (((_a = lectureData.subLectures) === null || _a === void 0 ? void 0 : _a.length) || 0);
            }, 0);
            const completedSubLectures = courseProgress.lectureProgress.reduce((count, lecture) => count + lecture.subLectureProgress.filter((sub) => sub.viewed).length, 0);
            courseProgress.completed = completedSubLectures === totalSubLectures;
        }
        yield courseProgress.save();
        res.status(200).json({
            success: true,
            message: "Sub-lecture progress updated successfully!",
            progressPercentage: courseProgress.progressPercentage, // Return progress percentage
        });
        return;
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});
exports.updateLectureProgress = updateLectureProgress;
const markAsCompleted = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { courseId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const courseProgress = yield courseProgressModel_1.CourseProgress.findOne({ courseId, userId });
        if (!courseProgress) {
            res.status(404).json({ success: false, message: "Course Progress not found" });
            return;
        }
        // Mark all lectures and sub-lectures as completed
        courseProgress.lectureProgress.forEach((lecture) => {
            lecture.viewed = true;
            lecture.subLectureProgress.forEach((sub) => (sub.viewed = true));
        });
        // Set the course as completed
        courseProgress.completed = true;
        // Set progressPercentage to 100%
        courseProgress.progressPercentage = 100;
        yield courseProgress.save();
        res.status(200).json({
            success: true,
            message: "Course marked as completed",
            progressPercentage: courseProgress.progressPercentage
        });
        return;
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});
exports.markAsCompleted = markAsCompleted;
const markAsInCompleted = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { courseId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const courseProgress = yield courseProgressModel_1.CourseProgress.findOne({ courseId, userId });
        if (!courseProgress) {
            res.status(404).json({ success: false, message: "Course Progress not found" });
            return;
        }
        // Mark all lectures and sub-lectures as incomplete
        courseProgress.lectureProgress.forEach((lecture) => {
            lecture.viewed = false;
            lecture.subLectureProgress.forEach((sub) => (sub.viewed = false));
        });
        // Set the course as incomplete
        courseProgress.completed = false;
        // Set progressPercentage to 0%
        courseProgress.progressPercentage = 0;
        yield courseProgress.save();
        res.status(200).json({
            success: true,
            message: "Course marked as incomplete",
            progressPercentage: courseProgress.progressPercentage
        });
        return;
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});
exports.markAsInCompleted = markAsInCompleted;
