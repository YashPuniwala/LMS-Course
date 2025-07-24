import mongoose from "mongoose";
import { Course } from "./courseModel";
import { CoursePurchase } from "./coursePurchaseModel";
import { Lecture } from "./lectureModel";
import { User } from "./userModel";

export interface DashboardMetrics {
  // Summary Metrics
  totalRevenue: number;
  totalSales: number;
  avgSaleValue: number;
  freeEnrollments: number;
  paidEnrollments: number;
  conversionRate: number;
  
  // Time-based Metrics
  monthlyTrend: {
    month: string;
    revenue: number;
    sales: number;
    newStudents: number;
  }[];
  
  // Course Performance
  topCourses: {
    courseId: mongoose.Types.ObjectId;
    title: string;
    revenue: number;
    enrollments: number;
    avgDuration: string;
  }[];
  
  // User Metrics
  totalStudents: number;
  activeStudents: number;
  
  // Content Metrics
  categories: {
    category: string;
    count: number;
    revenue: number;
  }[];
  totalCourses: number;
  totalLectures: number;
  totalSubLectures: number;
  avgCourseDuration: string;
}

export class DashboardModel {
  // Get all dashboard metrics
  static async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      // Calculate all metrics in parallel for better performance
      const [
        summaryMetrics,
        monthlyTrend,
        topCourses,
        userMetrics,
        contentMetrics
      ] = await Promise.all([
        this.getSummaryMetrics(),
        this.getMonthlyTrend(),
        this.getTopCourses(),
        this.getUserMetrics(),
        this.getContentMetrics()
      ]);

      return {
        ...summaryMetrics,
        monthlyTrend,
        topCourses,
        ...userMetrics,
        ...contentMetrics
      };
    } catch (error) {
      console.error("Error in getDashboardMetrics:", error);
      throw new Error("Failed to fetch dashboard metrics");
    }
  }

  // Summary metrics (revenue, sales, enrollments, etc.)
  private static async getSummaryMetrics() {
    const [revenueResult, salesResult, enrollmentTypes] = await Promise.all([
      CoursePurchase.aggregate([
        { $match: { status: { $in: ['completed', 'free'] } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      CoursePurchase.countDocuments({ status: { $in: ['completed', 'free'] } }),
      Promise.all([
        CoursePurchase.countDocuments({ status: 'free' }),
        CoursePurchase.countDocuments({ status: 'completed' })
      ])
    ]);

    const totalRevenue = revenueResult[0]?.total || 0;
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
  }

  // Monthly trends (revenue, sales, new students)
  private static async getMonthlyTrend() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [purchaseTrend, studentTrend] = await Promise.all([
      CoursePurchase.aggregate([
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
      User.aggregate([
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
        newStudents: studentData?.newStudents || 0
      };
    });

    return monthlyData;
  }

  // Top performing courses
  private static async getTopCourses() {
    const topCourses = await CoursePurchase.aggregate([
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
  }

  // User metrics (total and active students)
  private static async getUserMetrics() {
    const [totalStudents, activeStudents] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ enrolledCourses: { $exists: true, $not: { $size: 0 } } })
    ]);

    return {
      totalStudents,
      activeStudents
    };
  }

  // Content metrics (courses, lectures, sublectures, categories)
  private static async getContentMetrics() {
    const [courseCount, lectureCount, subLectureCount, categories] = await Promise.all([
      Course.countDocuments(),
      Lecture.countDocuments(),
      Lecture.aggregate([
        { $unwind: "$subLectures" },
        { $count: "totalSubLectures" }
      ]),
      Course.aggregate([
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
    const avgDuration = await Course.aggregate([
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
      totalSubLectures: subLectureCount[0]?.totalSubLectures || 0,
      categories,
      avgCourseDuration: formattedAvgDuration
    };
  }

  // Helper to format duration
  private static formatDuration(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    return `${hours}h ${minutes}m`;
  }
}