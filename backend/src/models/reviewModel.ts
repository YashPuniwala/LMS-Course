import mongoose, { Schema, Document } from "mongoose";
import { Course, CourseType } from "./courseModel";
import { User, UserType } from "./userModel";

export interface IReview extends Document {
  user: mongoose.Types.ObjectId | UserType;
  course: mongoose.Types.ObjectId | CourseType;
  rating: number;
  review?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, maxlength: 1000 },
  },
  { timestamps: true }
);

// Ensure a user can only review a course once
reviewSchema.index({ user: 1, course: 1 }, { unique: true });

export const Review = mongoose.model<IReview>("Review", reviewSchema);