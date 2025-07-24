import { Response } from "express";
import { AuthenticatedRequest, CreateCourseCustomRequest } from "../types/types";
import { Course } from "../models/courseModel";
import { CoursePurchase } from "../models/coursePurchaseModel";
import Stripe from "stripe";
import { Lecture } from "../models/lectureModel";
import { User } from "../models/userModel";
import mongoose from "mongoose";
import { CourseProgress } from "../models/courseProgressModel";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

export const createCheckoutSession = async (req: CreateCourseCustomRequest, res: Response): Promise<void> => {
  try {
    const { courseId } = req.body;
    const userId = req.user?._id || req.id;

    // Fetch the course from the database
    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({
        success: false,
        message: "Course not found!",
      });
      return;
    }

    // Ensure coursePrice is defined before proceeding
    const coursePrice = course?.coursePrice;
    if (!coursePrice) {
      res.status(400).json({
        success: false,
        message: "Course price is not available.",
      });
      return;
    }

    // Create a new purchase record
    const newPurchase = new CoursePurchase({
      courseId,
      userId,
      amount: coursePrice,
      status: "pending",
    });

    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
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
    } as unknown as Stripe.Checkout.SessionCreateParams);

    if (!session.url) {
      res.status(400).json({
        success: false,
        message: "Error while creating checkout session.",
      });
      return;
    }

    // Save the payment ID to the purchase record
    newPurchase.paymentId = session.id;
    await newPurchase.save();

    // Return the Stripe checkout URL
    res.status(200).json({
      success: true,
      url: session.url,
    });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "An error occurred while creating the checkout session.",
    });
    return;
  }
};

export const stripeWebhook = async (req: CreateCourseCustomRequest, res: Response): Promise<void> => {
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
  } catch (error: any) {
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

      const purchase = await CoursePurchase.findOne({
        paymentId: session.id,
      })
        .populate({
          path: "courseId",
          populate: {
            path: "lectures", // populate the lectures field as well
            model: "Lecture",  // specify the model for the lectures
          },
        });

      if (!purchase) {
        res.status(404).json({ message: "Purchase not found" });
        return;
      }

      // Ensure courseId is populated as a full Course object
      const course = purchase.courseId;  // Now it's the full Course document
      console.log(course, "course")
      if (session.amount_total) {
        purchase.amount = session.amount_total / 100;
      }
      console.log("Updating Purchase Status to Completed");

      purchase.status = "completed";
      await purchase.save();

      console.log("Purchase Updated Successfully:", purchase);

      // Make all lectures visible by setting `isFree` to true
      if (purchase.courseId && purchase.courseId.lectures && course?.lectures.length > 0) {
        await Lecture.updateMany(
          { _id: { $in: course.lectures } },
          { $set: { isFree: true } }
        );
      }

      await purchase.save();

      // Update user's enrolledCourses
      const updatedUser = await User.findByIdAndUpdate(
        purchase.userId,
        { $addToSet: { enrolledCourses: purchase.courseId._id } },
        { new: true }
      );
      
      if (!updatedUser) {
        console.error("Failed to update user's enrolledCourses");
         res.status(500).json({ message: "Failed to update user's enrolledCourses" });
         return;
      }
      
      console.log("Updated User:", updatedUser);

      // Update course to add user ID to enrolledStudents
      await Course.findByIdAndUpdate(
        purchase.courseId._id,
        { $addToSet: { enrolledStudents: purchase.userId } },
        { new: true }
      );
      console.log("Updating user's enrolledCourses with courseId:", purchase.courseId._id);

    } catch (error) {
      console.error("Error handling event:", error);
      res.status(500).json({ message: "Internal Server Error" });
      return;
    }
  }

  res.status(200).send();
};

export const getCourseDetailWithStatusQuery = async (req: CreateCourseCustomRequest, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const userId = req.user?._id || req.id;

    const course = await Course.findById(courseId)
      .populate({ path: "creator" })
      .populate({ path: "lectures" });

    // Check for both paid and free enrollments
    const purchased = await CoursePurchase.findOne({
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
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Failed to get course purchased detail"
    });
  }
};

export const getAllPurchasedCourse = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const purchasedCourse = await CoursePurchase.find({
      status: "completed"
    }).populate("courseId")

    if (!purchasedCourse) {
      res.status(400).json({
        purchasedCourse: []
      })
      return;
    }

    res.status(200).json({
      success: true,
      purchasedCourse
    })
    return;
  } catch (error) {
    console.log(error)
  }
}

export const enrollFreeCourse = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const userId = req.user?._id;

    console.log("Free Course Enrollment Debug:", {
      courseId,
      userId: userId?.toString()
    });

    // Check if course exists and is free
    const course = await Course.findById(courseId);
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
    const existingPurchase = await CoursePurchase.findOne({
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
    const purchase = new CoursePurchase({
      courseId,
      userId,
      amount: 0,
      status: 'free'
    });
    await purchase.save();

    // Detailed update with explicit $addToSet and logging
    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      { 
        $addToSet: { 
          enrolledStudents: userId 
        }
      },
      { 
        new: true,
        runValidators: true 
      }
    );

    console.log("Updated Course after Free Enrollment:", {
      courseId: updatedCourse?._id,
      enrolledStudents: updatedCourse?.enrolledStudents,
      enrolledStudentsCount: updatedCourse?.enrolledStudents.length
    });

    // Update user's enrolled courses
    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { enrolledCourses: courseId } },
      { new: true }
    );

    // Make all lectures visible
    if (course.lectures && course.lectures.length > 0) {
      await Lecture.updateMany(
        { _id: { $in: course.lectures } },
        { $set: { isPreviewFree: true } }
      );
    }

    res.status(200).json({
      success: true,
      message: "Successfully enrolled in free course",
      purchase,
      enrolledStudents: updatedCourse?.enrolledStudents
    });
  } catch (error) {
    console.error("Free Enrollment Error:", error);
    res.status(500).json({ 
      message: "Internal server error",
      errorDetails: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

interface DashboardMetrics {
  totalRevenue: number;
  totalSales: number;
  avgSaleValue: number;
  freeEnrollments: number;
  paidEnrollments: number;
  conversionRate: number;
  monthlyTrend: {
    month: string;
    revenue: number;
    sales: number;
  }[];
  topCourses: {
    courseId: mongoose.Types.ObjectId;
    title: string;
    revenue: number;
    enrollments: number;
  }[];
  studentGrowth: {
    month: string;
    newStudents: number;
  }[];
  categories: {
    category: string;
    count: number;
    revenue: number;
  }[];
}

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get the instructor ID from the request (assuming it's available after authentication)
    const instructorId = req.user?._id;
    if (!instructorId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // 1. Get basic course statistics
    const courseStats = await Course.aggregate([
      { $match: { creator: new mongoose.Types.ObjectId(instructorId) } },
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
    const revenueStats = await CoursePurchase.aggregate([
      {
        $lookup: {
          from: 'courses',
          localField: 'courseId',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: '$course' },
      { $match: { 'course.creator': new mongoose.Types.ObjectId(instructorId) } },
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

    const enrollmentTrends = await CoursePurchase.aggregate([
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
          'course.creator': new mongoose.Types.ObjectId(instructorId),
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
    const topCourses = await Course.aggregate([
      { $match: { creator: new mongoose.Types.ObjectId(instructorId) } },
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
    const progressStats = await CourseProgress.aggregate([
      {
        $lookup: {
          from: 'courses',
          localField: 'courseId',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: '$course' },
      { $match: { 'course.creator': new mongoose.Types.ObjectId(instructorId) } },
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
    const contentStats = await Lecture.aggregate([
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: 'lectures',
          as: 'course'
        }
      },
      { $unwind: '$course' },
      { $match: { 'course.creator': new mongoose.Types.ObjectId(instructorId) } },
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
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};