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
exports.getUserReviewForCourse = exports.getCourseReviews = exports.deleteReview = exports.updateReview = exports.createReview = exports.calculateAverageRatings = void 0;
const reviewModel_1 = require("../models/reviewModel");
const courseModel_1 = require("../models/courseModel");
const mongoose_1 = __importDefault(require("mongoose"));
const calculateAverageRatings = (courseId) => __awaiter(void 0, void 0, void 0, function* () {
    // Convert to ObjectId if it's a string
    const courseObjectId = typeof courseId === 'string'
        ? new mongoose_1.default.Types.ObjectId(courseId)
        : courseId;
    const stats = yield reviewModel_1.Review.aggregate([
        {
            $match: { course: courseObjectId },
        },
        {
            $group: {
                _id: "$course",
                nRating: { $sum: 1 },
                avgRating: { $avg: "$rating" },
            },
        },
    ]);
    if (stats.length > 0) {
        yield courseModel_1.Course.findByIdAndUpdate(courseObjectId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating,
        });
    }
    else {
        yield courseModel_1.Course.findByIdAndUpdate(courseObjectId, {
            ratingsQuantity: 0,
            ratingsAverage: 0,
        });
    }
});
exports.calculateAverageRatings = calculateAverageRatings;
const createReview = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { courseId } = req.params;
        const { rating, review } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!rating || !userId) {
            res.status(400).json({
                success: false,
                message: "Rating and user ID are required",
            });
            return;
        }
        // Check if user is enrolled in the course
        const course = yield courseModel_1.Course.findOne({
            _id: courseId,
            enrolledStudents: userId,
        });
        if (!course) {
            res.status(403).json({
                success: false,
                message: "You must be enrolled in the course to review it",
            });
            return;
        }
        // Check if user already reviewed this course
        const existingReview = yield reviewModel_1.Review.findOne({
            user: userId,
            course: courseId,
        });
        if (existingReview) {
            res.status(400).json({
                success: false,
                message: "You have already reviewed this course",
            });
            return;
        }
        // Create new review
        const newReview = yield reviewModel_1.Review.create({
            user: userId,
            course: courseId,
            rating,
            review,
        });
        // Add review to course
        yield courseModel_1.Course.findByIdAndUpdate(courseId, {
            $push: { reviews: newReview._id },
        });
        // Calculate new average ratings
        yield (0, exports.calculateAverageRatings)(courseId);
        res.status(201).json({
            success: true,
            message: "Review submitted successfully",
            review: newReview,
        });
    }
    catch (error) {
        console.error("Error creating review:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create review",
        });
    }
});
exports.createReview = createReview;
const updateReview = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { reviewId } = req.params;
        const { rating, review } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!rating) {
            res.status(400).json({
                success: false,
                message: "Rating is required",
            });
            return;
        }
        // Find and update review
        const updatedReview = yield reviewModel_1.Review.findOneAndUpdate({ _id: reviewId, user: userId }, { rating, review }, { new: true, runValidators: true });
        if (!updatedReview) {
            res.status(404).json({
                success: false,
                message: "Review not found or you're not authorized to update it",
            });
            return;
        }
        // Recalculate average ratings
        yield (0, exports.calculateAverageRatings)(updatedReview.course.toString());
        res.status(200).json({
            success: true,
            message: "Review updated successfully",
            review: updatedReview,
        });
    }
    catch (error) {
        console.error("Error updating review:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update review",
        });
    }
});
exports.updateReview = updateReview;
const deleteReview = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { reviewId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const review = yield reviewModel_1.Review.findOneAndDelete({
            _id: reviewId,
            user: userId,
        });
        if (!review) {
            res.status(404).json({
                success: false,
                message: "Review not found or you're not authorized to delete it",
            });
            return;
        }
        // Remove review from course
        yield courseModel_1.Course.findByIdAndUpdate(review.course, {
            $pull: { reviews: review._id },
        });
        // Recalculate average ratings
        yield (0, exports.calculateAverageRatings)(review.course.toString());
        res.status(200).json({
            success: true,
            message: "Review deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting review:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete review",
        });
    }
});
exports.deleteReview = deleteReview;
const getCourseReviews = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { courseId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const reviews = yield reviewModel_1.Review.find({ course: courseId })
            .populate({
            path: "user",
            select: "name photoUrl",
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const totalReviews = yield reviewModel_1.Review.countDocuments({ course: courseId });
        res.status(200).json({
            success: true,
            count: reviews.length,
            total: totalReviews,
            page,
            pages: Math.ceil(totalReviews / limit),
            reviews,
        });
        return;
    }
    catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch reviews",
        });
    }
});
exports.getCourseReviews = getCourseReviews;
const getUserReviewForCourse = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { courseId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const review = yield reviewModel_1.Review.findOne({
            user: userId,
            course: courseId,
        });
        res.status(200).json({
            success: true,
            review: review || null,
        });
        return;
    }
    catch (error) {
        console.error("Error fetching user review:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch user review",
        });
    }
});
exports.getUserReviewForCourse = getUserReviewForCourse;
