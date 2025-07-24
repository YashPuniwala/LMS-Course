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
exports.DashboardModel = void 0;
const courseModel_1 = require("./courseModel");
const coursePurchaseModel_1 = require("./coursePurchaseModel");
const lectureModel_1 = require("./lectureModel");
const userModel_1 = require("./userModel");
class DashboardModel {
    // Get all dashboard metrics
    static getDashboardMetrics() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Calculate all metrics in parallel for better performance
                const [summaryMetrics, monthlyTrend, topCourses, userMetrics, contentMetrics] = yield Promise.all([
                    this.getSummaryMetrics(),
                    this.getMonthlyTrend(),
                    this.getTopCourses(),
                    this.getUserMetrics(),
                    this.getContentMetrics()
                ]);
                return Object.assign(Object.assign(Object.assign(Object.assign({}, summaryMetrics), { monthlyTrend,
                    topCourses }), userMetrics), contentMetrics);
            }
            catch (error) {
                console.error("Error in getDashboardMetrics:", error);
                throw new Error("Failed to fetch dashboard metrics");
            }
        });
    }
    // Summary metrics (revenue, sales, enrollments, etc.)
    static getSummaryMetrics() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const [revenueResult, salesResult, enrollmentTypes] = yield Promise.all([
                coursePurchaseModel_1.CoursePurchase.aggregate([
                    { $match: { status: { $in: ['completed', 'free'] } } },
                    { $group: { _id: null, total: { $sum: "$amount" } } }
                ]),
                coursePurchaseModel_1.CoursePurchase.countDocuments({ status: { $in: ['completed', 'free'] } }),
                Promise.all([
                    coursePurchaseModel_1.CoursePurchase.countDocuments({ status: 'free' }),
                    coursePurchaseModel_1.CoursePurchase.countDocuments({ status: 'completed' })
                ])
            ]);
            const totalRevenue = ((_a = revenueResult[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
            const totalSales = salesResult || 0;
            const [freeEnrollments, paidEnrollments] = enrollmentTypes;
            const conversionRate = totalSales > 0 ? (paidEnrollments / totalSales) * 100 : 0;
            return {
                totalRevenue,
                totalSales,
                avgSaleValue: totalSales > 0 ? totalRevenue / totalSales : 0,
                freeEnrollments,
                paidEnrollments,
                conversionRate
            };
        });
    }
    // Monthly trends (revenue, sales, new students)
    static getMonthlyTrend() {
        return __awaiter(this, void 0, void 0, function* () {
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            const [purchaseTrend, studentTrend] = yield Promise.all([
                coursePurchaseModel_1.CoursePurchase.aggregate([
                    {
                        $match: {
                            status: { $in: ['completed', 'free'] },
                            createdAt: { $gte: sixMonthsAgo }
                        }
                    },
                    {
                        $group: {
                            _id: {
                                month: { $month: "$createdAt" },
                                year: { $year: "$createdAt" }
                            },
                            revenue: { $sum: "$amount" },
                            sales: { $sum: 1 }
                        }
                    },
                    { $sort: { "_id.year": 1, "_id.month": 1 } },
                    {
                        $project: {
                            month: {
                                $dateToString: {
                                    format: "%Y-%m",
                                    date: {
                                        $dateFromParts: {
                                            year: "$_id.year",
                                            month: "$_id.month",
                                            day: 1
                                        }
                                    }
                                }
                            },
                            revenue: 1,
                            sales: 1,
                            _id: 0
                        }
                    }
                ]),
                userModel_1.User.aggregate([
                    {
                        $match: {
                            createdAt: { $gte: sixMonthsAgo }
                        }
                    },
                    {
                        $group: {
                            _id: {
                                month: { $month: "$createdAt" },
                                year: { $year: "$createdAt" }
                            },
                            newStudents: { $sum: 1 }
                        }
                    },
                    { $sort: { "_id.year": 1, "_id.month": 1 } },
                    {
                        $project: {
                            month: {
                                $dateToString: {
                                    format: "%Y-%m",
                                    date: {
                                        $dateFromParts: {
                                            year: "$_id.year",
                                            month: "$_id.month",
                                            day: 1
                                        }
                                    }
                                }
                            },
                            newStudents: 1,
                            _id: 0
                        }
                    }
                ])
            ]);
            // Merge purchase and student data by month
            const monthlyData = purchaseTrend.map(purchase => {
                const studentData = studentTrend.find(s => s.month === purchase.month);
                return {
                    month: purchase.month,
                    revenue: purchase.revenue,
                    sales: purchase.sales,
                    newStudents: (studentData === null || studentData === void 0 ? void 0 : studentData.newStudents) || 0
                };
            });
            return monthlyData;
        });
    }
    // Top performing courses
    static getTopCourses() {
        return __awaiter(this, void 0, void 0, function* () {
            const topCourses = yield coursePurchaseModel_1.CoursePurchase.aggregate([
                {
                    $match: { status: { $in: ['completed', 'free'] } }
                },
                {
                    $group: {
                        _id: "$courseId",
                        revenue: { $sum: "$amount" },
                        enrollments: { $sum: 1 }
                    }
                },
                { $sort: { revenue: -1 } },
                { $limit: 5 },
                {
                    $lookup: {
                        from: "courses",
                        localField: "_id",
                        foreignField: "_id",
                        as: "course"
                    }
                },
                { $unwind: "$course" },
                {
                    $project: {
                        courseId: "$_id",
                        title: "$course.courseTitle",
                        revenue: 1,
                        enrollments: 1,
                        avgDuration: "$course.formattedDuration",
                        _id: 0
                    }
                }
            ]);
            return topCourses;
        });
    }
    // User metrics (total and active students)
    static getUserMetrics() {
        return __awaiter(this, void 0, void 0, function* () {
            const [totalStudents, activeStudents] = yield Promise.all([
                userModel_1.User.countDocuments(),
                userModel_1.User.countDocuments({ enrolledCourses: { $exists: true, $not: { $size: 0 } } })
            ]);
            return {
                totalStudents,
                activeStudents
            };
        });
    }
    // Content metrics (courses, lectures, sublectures, categories)
    static getContentMetrics() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const [courseCount, lectureCount, subLectureCount, categories] = yield Promise.all([
                courseModel_1.Course.countDocuments(),
                lectureModel_1.Lecture.countDocuments(),
                lectureModel_1.Lecture.aggregate([
                    { $unwind: "$subLectures" },
                    { $count: "totalSubLectures" }
                ]),
                courseModel_1.Course.aggregate([
                    {
                        $lookup: {
                            from: "coursepurchases",
                            localField: "_id",
                            foreignField: "courseId",
                            as: "purchases"
                        }
                    },
                    { $unwind: { path: "$purchases", preserveNullAndEmptyArrays: true } },
                    {
                        $match: {
                            "purchases.status": { $in: ['completed', 'free'] }
                        }
                    },
                    {
                        $group: {
                            _id: "$category",
                            count: { $sum: 1 },
                            revenue: { $sum: "$purchases.amount" }
                        }
                    },
                    { $sort: { revenue: -1 } },
                    {
                        $project: {
                            category: "$_id",
                            count: 1,
                            revenue: 1,
                            _id: 0
                        }
                    }
                ])
            ]);
            // Calculate average course duration
            const avgDuration = yield courseModel_1.Course.aggregate([
                {
                    $group: {
                        _id: null,
                        avgMinutes: { $avg: "$totalMinutes" }
                    }
                }
            ]);
            const formattedAvgDuration = avgDuration.length > 0
                ? this.formatDuration(avgDuration[0].avgMinutes)
                : "0h 0m";
            return {
                totalCourses: courseCount,
                totalLectures: lectureCount,
                totalSubLectures: ((_a = subLectureCount[0]) === null || _a === void 0 ? void 0 : _a.totalSubLectures) || 0,
                categories,
                avgCourseDuration: formattedAvgDuration
            };
        });
    }
    // Helper to format duration
    static formatDuration(totalMinutes) {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = Math.round(totalMinutes % 60);
        return `${hours}h ${minutes}m`;
    }
}
exports.DashboardModel = DashboardModel;
