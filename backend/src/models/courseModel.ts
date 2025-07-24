import mongoose, { Schema, Document, Model } from "mongoose";
import { IReview } from "./reviewModel";

export interface CourseType extends Document {
  courseTitle: string;
  isFree?: boolean;
  subTitle?: string;
  description?: string;
  category: string;
  courseLevel?: "Beginner" | "Medium" | "Advance";
  coursePrice?: number;
  courseThumbnail?: string;
  enrolledStudents: mongoose.Types.ObjectId[];
  lectures: mongoose.Types.ObjectId[];
  creator: mongoose.Types.ObjectId;
  isPublished: boolean;
  tutorial?: {
    videoUrl?: string;
    publicId?: string;
    tutorialDescription?: string;
  };
  ratingsAverage?: number;
  ratingsQuantity?: number;
  reviews?: mongoose.Types.ObjectId[] | IReview[];
  totalMinutes: number; // Total minutes across all lectures
  totalHours: number; // Total hours in decimal (e.g., 3.5)
  createdAt?: Date;
  updatedAt?: Date;
}

const courseSchema: Schema<CourseType> = new mongoose.Schema(
  {
    courseTitle: {
      type: String,
      required: true,
    },
    isFree: {
      type: Boolean,
      default: false,
    },
    subTitle: String,
    description: String,
    category: {
      type: String,
      required: true,
    },
    courseLevel: {
      type: String,
      enum: ["Beginner", "Medium", "Advance"],
    },
    coursePrice: Number,
    courseThumbnail: String,
    enrolledStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    lectures: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lecture",
      },
    ],
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Ensure this matches the model name of your User schema
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    tutorial: {
      videoUrl: String,
      publicId: String,
      tutorialDescription: String,
    },
    ratingsAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingsQuantity: { type: Number, default: 0 },
    reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }],
    totalMinutes: {
      type: Number,
      default: 0,
    },
    totalHours: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

courseSchema.virtual("duration").get(function () {
  return {
    hours: Math.floor(this.totalMinutes / 60),
    minutes: this.totalMinutes % 60,
  };
});

// Virtual for formatted display
courseSchema.virtual("formattedDuration").get(function () {
  const hours = Math.floor(this.totalMinutes / 60);
  const minutes = this.totalMinutes % 60;
  return `${hours}h ${minutes}m`;
});

export const Course: Model<CourseType> = mongoose.model<CourseType>(
  "Course",
  courseSchema
);
