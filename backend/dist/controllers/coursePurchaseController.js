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
exports.getDashboardStats = exports.enrollFreeCourse = exports.getAllPurchasedCourse = exports.getCourseDetailWithStatusQuery = exports.stripeWebhook = exports.createCheckoutSession = void 0;
const courseModel_1 = require("../models/courseModel");
const coursePurchaseModel_1 = require("../models/coursePurchaseModel");
const stripe_1 = __importDefault(require("stripe"));
const lectureModel_1 = require("../models/lectureModel");
const userModel_1 = require("../models/userModel");
const mongoose_1 = __importDefault(require("mongoose"));
const courseProgressModel_1 = require("../models/courseProgressModel");
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY);
const createCheckoutSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { courseId } = req.body;
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || req.id;
        // Fetch the course from the database
        const course = yield courseModel_1.Course.findById(courseId);
        if (!course) {
            res.status(404).json({
                success: false,
                message: "Course not found!",
            });
            return;
        }
        // Ensure coursePrice is defined before proceeding
        const coursePrice = course === null || course === void 0 ? void 0 : course.coursePrice;
        if (!coursePrice) {
            res.status(400).json({
                success: false,
                message: "Course price is not available.",
            });
            return;
        }
        // Create a new purchase record
        const newPurchase = new coursePurchaseModel_1.CoursePurchase({
            courseId,
            userId,
            amount: coursePrice,
            status: "pending",
        });
        // Create a checkout session
        const session = yield stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: "inr",
                        product_data: {
                            name: course.courseTitle,
                            images: [course.courseThumbnail],
                        },
                        unit_amount: coursePrice * 100, // Convert to paise (100 paise = 1 INR)
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${process.env.FRONTEND_URL}/course-progress/${courseId}`,
            cancel_url: `${process.env.FRONTEND_URL}/course-detail/${courseId}`,
            metadata: {
                courseId: courseId,
            },
        });
        if (!session.url) {
            res.status(400).json({
                success: false,
                message: "Error while creating checkout session.",
            });
            return;
        }
        // Save the payment ID to the purchase record
        newPurchase.paymentId = session.id;
        yield newPurchase.save();
        // Return the Stripe checkout URL
        res.status(200).json({
            success: true,
            url: session.url,
        });
        return;
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "An error occurred while creating the checkout session.",
        });
        return;
    }
});
exports.createCheckoutSession = createCheckoutSession;
const stripeWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Stripe Webhook API called"); // Log to confirm the API is triggered
    let event;
    try {
        const payloadString = JSON.stringify(req.body, null, 2);
        const secret = process.env.WEBHOOK_ENDPOINT_SECRET;
        if (!secret) {
            throw new Error('Webhook secret not found');
        }
        const header = stripe.webhooks.generateTestHeaderString({
            payload: payloadString,
            secret,
        });
        event = stripe.webhooks.constructEvent(payloadString, header, secret);
    }
    catch (error) {
        console.error("Webhook error:", error.message);
        res.status(400).send(`Webhook error: ${error.message}`);
        return;
    }
    // Handle the checkout session completed event
    if (event.type === "checkout.session.completed") {
        console.log("checkout.session.completed event received:", event.data.object);
        try {
            const session = event.data.object;
            console.log("Stripe Event Data:", event.data.object);
            const purchase = yield coursePurchaseModel_1.CoursePurchase.findOne({
                paymentId: session.id,
            })
                .populate({
                path: "courseId",
                populate: {
                    path: "lectures", // populate the lectures field as well
                    model: "Lecture", // specify the model for the lectures
                },
            });
            if (!purchase) {
                res.status(404).json({ message: "Purchase not found" });
                return;
            }
            // Ensure courseId is populated as a full Course object
            const course = purchase.courseId; // Now it's the full Course document
            console.log(course, "course");
            if (session.amount_total) {
                purchase.amount = session.amount_total / 100;
            }
            console.log("Updating Purchase Status to Completed");
            purchase.status = "completed";
            yield purchase.save();
            console.log("Purchase Updated Successfully:", purchase);
            // Make all lectures visible by setting `isFree` to true
            if (purchase.courseId && purchase.courseId.lectures && (course === null || course === void 0 ? void 0 : course.lectures.length) > 0) {
                yield lectureModel_1.Lecture.updateMany({ _id: { $in: course.lectures } }, { $set: { isFree: true } });
            }
            yield purchase.save();
            // Update user's enrolledCourses
            const updatedUser = yield userModel_1.User.findByIdAndUpdate(purchase.userId, { $addToSet: { enrolledCourses: purchase.courseId._id } }, { new: true });
            if (!updatedUser) {
                console.error("Failed to update user's enrolledCourses");
                res.status(500).json({ message: "Failed to update user's enrolledCourses" });
                return;
            }
            console.log("Updated User:", updatedUser);
            // Update course to add user ID to enrolledStudents
            yield courseModel_1.Course.findByIdAndUpdate(purchase.courseId._id, { $addToSet: { enrolledStudents: purchase.userId } }, { new: true });
            console.log("Updating user's enrolledCourses with courseId:", purchase.courseId._id);
        }
        catch (error) {
            console.error("Error handling event:", error);
            res.status(500).json({ message: "Internal Server Error" });
            return;
        }
    }
    res.status(200).send();
});
exports.stripeWebhook = stripeWebhook;
const getCourseDetailWithStatusQuery = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { courseId } = req.params;
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || req.id;
        const course = yield courseModel_1.Course.findById(courseId)
            .populate({ path: "creator" })
            .populate({ path: "lectures" });
        // Check for both paid and free enrollments
        const purchased = yield coursePurchaseModel_1.CoursePurchase.findOne({
            userId,
            courseId,
            $or: [
                { status: 'completed' },
                { status: 'free' }
            ]
        });
        if (!course) {
            res.status(404).json({ message: "course not found!" });
            return;
        }
        res.status(200).json({
            course,
            purchased: !!purchased,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Failed to get course purchased detail"
        });
    }
});
exports.getCourseDetailWithStatusQuery = getCourseDetailWithStatusQuery;
const getAllPurchasedCourse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const purchasedCourse = yield coursePurchaseModel_1.CoursePurchase.find({
            status: "completed"
        }).populate("courseId");
        if (!purchasedCourse) {
            res.status(400).json({
                purchasedCourse: []
            });
            return;
        }
        res.status(200).json({
            success: true,
            purchasedCourse
        });
        return;
    }
    catch (error) {
        console.log(error);
    }
});
exports.getAllPurchasedCourse = getAllPurchasedCourse;
const enrollFreeCourse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { courseId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        console.log("Free Course Enrollment Debug:", {
            courseId,
            userId: userId === null || userId === void 0 ? void 0 : userId.toString()
        });
        // Check if course exists and is free
        const course = yield courseModel_1.Course.findById(courseId);
        if (!course) {
            console.error("Course not found:", courseId);
            res.status(404).json({ message: "Course not found" });
            return;
        }
        if (!course.isFree) {
            res.status(400).json({ message: "This is not a free course" });
            return;
        }
        // Check if user already enrolled
        const existingPurchase = yield coursePurchaseModel_1.CoursePurchase.findOne({
            courseId,
            userId,
            $or: [
                { status: 'completed' },
                { status: 'free' }
            ]
        });
        if (existingPurchase) {
            res.status(400).json({ message: "Already enrolled in this course" });
            return;
        }
        // Create new free enrollment record
        const purchase = new coursePurchaseModel_1.CoursePurchase({
            courseId,
            userId,
            amount: 0,
            status: 'free'
        });
        yield purchase.save();
        // Detailed update with explicit $addToSet and logging
        const updatedCourse = yield courseModel_1.Course.findByIdAndUpdate(courseId, {
            $addToSet: {
                enrolledStudents: userId
            }
        }, {
            new: true,
            runValidators: true
        });
        console.log("Updated Course after Free Enrollment:", {
            courseId: updatedCourse === null || updatedCourse === void 0 ? void 0 : updatedCourse._id,
            enrolledStudents: updatedCourse === null || updatedCourse === void 0 ? void 0 : updatedCourse.enrolledStudents,
            enrolledStudentsCount: updatedCourse === null || updatedCourse === void 0 ? void 0 : updatedCourse.enrolledStudents.length
        });
        // Update user's enrolled courses
        yield userModel_1.User.findByIdAndUpdate(userId, { $addToSet: { enrolledCourses: courseId } }, { new: true });
        // Make all lectures visible
        if (course.lectures && course.lectures.length > 0) {
            yield lectureModel_1.Lecture.updateMany({ _id: { $in: course.lectures } }, { $set: { isPreviewFree: true } });
        }
        res.status(200).json({
            success: true,
            message: "Successfully enrolled in free course",
            purchase,
            enrolledStudents: updatedCourse === null || updatedCourse === void 0 ? void 0 : updatedCourse.enrolledStudents
        });
    }
    catch (error) {
        console.error("Free Enrollment Error:", error);
        res.status(500).json({
            message: "Internal server error",
            errorDetails: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.enrollFreeCourse = enrollFreeCourse;
const getDashboardStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Get the instructor ID from the request (assuming it's available after authentication)
        const instructorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!instructorId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        // 1. Get basic course statistics
        const courseStats = yield courseModel_1.Course.aggregate([
            { $match: { creator: new mongoose_1.default.Types.ObjectId(instructorId) } },
            {
                $group: {
                    _id: null,
                    totalCourses: { $sum: 1 },
                    publishedCourses: {
                        $sum: { $cond: [{ $eq: ['$isPublished', true] }, 1, 0] },
                    },
                    freeCourses: {
                        $sum: { $cond: [{ $eq: ['$isFree', true] }, 1, 0] },
                    },
                    paidCourses: {
                        $sum: { $cond: [{ $eq: ['$isFree', false] }, 1, 0] },
                    },
                    totalEnrollments: { $sum: { $size: '$enrolledStudents' } },
                    avgRating: { $avg: '$rating' } // Assuming you have a rating field
                }
            },
            {
                $project: {
                    _id: 0,
                    totalCourses: 1,
                    publishedCourses: 1,
                    draftCourses: { $subtract: ['$totalCourses', '$publishedCourses'] },
                    freeCourses: 1,
                    paidCourses: 1,
                    totalEnrollments: 1,
                    avgRating: { $ifNull: ['$avgRating', 0] }
                }
            }
        ]);
        // 2. Get revenue statistics (only for paid courses)
        const revenueStats = yield coursePurchaseModel_1.CoursePurchase.aggregate([
            {
                $lookup: {
                    from: 'courses',
                    localField: 'courseId',
                    foreignField: '_id',
                    as: 'course'
                }
            },
            { $unwind: '$course' },
            { $match: { 'course.creator': new mongoose_1.default.Types.ObjectId(instructorId) } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$amount' },
                    completedPayments: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                    },
                    pendingPayments: {
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                    },
                    freeEnrollments: {
                        $sum: { $cond: [{ $eq: ['$status', 'free'] }, 1, 0] }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalRevenue: 1,
                    completedPayments: 1,
                    pendingPayments: 1,
                    freeEnrollments: 1
                }
            }
        ]);
        // 3. Get enrollment trends (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const enrollmentTrends = yield coursePurchaseModel_1.CoursePurchase.aggregate([
            {
                $lookup: {
                    from: 'courses',
                    localField: 'courseId',
                    foreignField: '_id',
                    as: 'course'
                }
            },
            { $unwind: '$course' },
            { $match: {
                    'course.creator': new mongoose_1.default.Types.ObjectId(instructorId),
                    createdAt: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 },
                    revenue: { $sum: '$amount' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
            {
                $project: {
                    _id: 0,
                    month: {
                        $dateToString: {
                            format: '%Y-%m',
                            date: {
                                $dateFromParts: {
                                    year: '$_id.year',
                                    month: '$_id.month',
                                    day: 1
                                }
                            }
                        }
                    },
                    count: 1,
                    revenue: 1
                }
            }
        ]);
        // 4. Get top performing courses
        const topCourses = yield courseModel_1.Course.aggregate([
            { $match: { creator: new mongoose_1.default.Types.ObjectId(instructorId) } },
            {
                $lookup: {
                    from: 'coursepurchases',
                    localField: '_id',
                    foreignField: 'courseId',
                    as: 'purchases'
                }
            },
            {
                $project: {
                    courseTitle: 1,
                    isPublished: 1,
                    isFree: 1,
                    coursePrice: 1,
                    enrolledStudents: 1,
                    enrollmentCount: { $size: '$enrolledStudents' },
                    revenue: {
                        $sum: '$purchases.amount'
                    },
                    thumbnail: '$courseThumbnail'
                }
            },
            { $sort: { enrollmentCount: -1 } },
            { $limit: 5 }
        ]);
        // 5. Get student progress statistics
        const progressStats = yield courseProgressModel_1.CourseProgress.aggregate([
            {
                $lookup: {
                    from: 'courses',
                    localField: 'courseId',
                    foreignField: '_id',
                    as: 'course'
                }
            },
            { $unwind: '$course' },
            { $match: { 'course.creator': new mongoose_1.default.Types.ObjectId(instructorId) } },
            {
                $group: {
                    _id: null,
                    totalEnrollments: { $sum: 1 },
                    completedCourses: {
                        $sum: { $cond: [{ $eq: ['$completed', true] }, 1, 0] }
                    },
                    avgProgress: { $avg: '$progressPercentage' }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalEnrollments: 1,
                    completedCourses: 1,
                    completionRate: {
                        $multiply: [
                            { $divide: ['$completedCourses', '$totalEnrollments'] },
                            100
                        ]
                    },
                    avgProgress: 1
                }
            }
        ]);
        // 6. Get content statistics (lectures and duration)
        const contentStats = yield lectureModel_1.Lecture.aggregate([
            {
                $lookup: {
                    from: 'courses',
                    localField: '_id',
                    foreignField: 'lectures',
                    as: 'course'
                }
            },
            { $unwind: '$course' },
            { $match: { 'course.creator': new mongoose_1.default.Types.ObjectId(instructorId) } },
            {
                $group: {
                    _id: null,
                    totalLectures: { $sum: 1 },
                    totalSubLectures: { $sum: { $size: '$subLectures' } },
                    totalMinutes: { $sum: '$totalMinutes' },
                    totalHours: { $sum: '$totalHours' }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalLectures: 1,
                    totalSubLectures: 1,
                    totalMinutes: 1,
                    totalHours: { $round: ['$totalHours', 2] },
                    formattedDuration: {
                        $concat: [
                            { $toString: { $floor: { $divide: ['$totalMinutes', 60] } } },
                            'h ',
                            { $toString: { $mod: ['$totalMinutes', 60] } },
                            'm'
                        ]
                    }
                }
            }
        ]);
        // Combine all stats into a single response
        const dashboardStats = {
            courseStats: courseStats[0] || {},
            revenueStats: revenueStats[0] || {},
            enrollmentTrends,
            topCourses,
            progressStats: progressStats[0] || {},
            contentStats: contentStats[0] || {}
        };
        res.status(200).json({
            success: true,
            data: dashboardStats
        });
    }
    catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard statistics',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.getDashboardStats = getDashboardStats;
