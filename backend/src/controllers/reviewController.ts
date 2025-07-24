import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../types/types";
import { Review } from "../models/reviewModel";
import { Course } from "../models/courseModel";
import mongoose from "mongoose";

export const calculateAverageRatings = async (courseId: string | mongoose.Types.ObjectId) => {
    // Convert to ObjectId if it's a string
    const courseObjectId = typeof courseId === 'string' 
      ? new mongoose.Types.ObjectId(courseId) 
      : courseId;
  
    const stats = await Review.aggregate([
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
      await Course.findByIdAndUpdate(courseObjectId, {
        ratingsQuantity: stats[0].nRating,
        ratingsAverage: stats[0].avgRating,
      });
    } else {
      await Course.findByIdAndUpdate(courseObjectId, {
        ratingsQuantity: 0,
        ratingsAverage: 0,
      });
    }
  };

export const createReview = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
    try {
    const { courseId } = req.params;
    const { rating, review } = req.body;
    const userId = req.user?._id;

    if (!rating || !userId) {
       res.status(400).json({
        success: false,
        message: "Rating and user ID are required",
      });
      return;
    }

    // Check if user is enrolled in the course
    const course = await Course.findOne({
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
    const existingReview = await Review.findOne({
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
    const newReview = await Review.create({
      user: userId,
      course: courseId,
      rating,
      review,
    });

    // Add review to course
    await Course.findByIdAndUpdate(courseId, {
      $push: { reviews: newReview._id },
    });

    // Calculate new average ratings
    await calculateAverageRatings(courseId);

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      review: newReview,
    });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create review",
    });
  }
};

export const updateReview = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
    try {
    const { reviewId } = req.params;
    const { rating, review } = req.body;
    const userId = req.user?._id;

    if (!rating) {
       res.status(400).json({
        success: false,
        message: "Rating is required",
      });
      return;
    }

    // Find and update review
    const updatedReview = await Review.findOneAndUpdate(
      { _id: reviewId, user: userId },
      { rating, review },
      { new: true, runValidators: true }
    );

    if (!updatedReview) {
       res.status(404).json({
        success: false,
        message: "Review not found or you're not authorized to update it",
      });
      return;
    }

    // Recalculate average ratings
    await calculateAverageRatings(updatedReview.course.toString());

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      review: updatedReview,
    });
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update review",
    });
  }
};

export const deleteReview = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {

  try {
    const { reviewId } = req.params;
    const userId = req.user?._id;

    const review = await Review.findOneAndDelete({
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
    await Course.findByIdAndUpdate(review.course, {
      $pull: { reviews: review._id },
    });

    // Recalculate average ratings
    await calculateAverageRatings(review.course.toString());

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete review",
    });
  }
};

export const getCourseReviews = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
    try {
    const { courseId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ course: courseId })
      .populate({
        path: "user",
        select: "name photoUrl",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalReviews = await Review.countDocuments({ course: courseId });

    res.status(200).json({
      success: true,
      count: reviews.length,
      total: totalReviews,
      page,
      pages: Math.ceil(totalReviews / limit),
      reviews,
    });
    return;
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
    });
  }
};

export const getUserReviewForCourse = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
    try {
    const { courseId } = req.params;
    const userId = req.user?._id;

    const review = await Review.findOne({
      user: userId,
      course: courseId,
    });

    res.status(200).json({
      success: true,
      review: review || null,
    });
    return;
  } catch (error) {
    console.error("Error fetching user review:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user review",
    });
  }
};