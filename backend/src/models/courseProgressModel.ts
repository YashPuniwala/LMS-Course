import mongoose, { Document, Schema, Model } from "mongoose";

// Define an interface for SubLectureProgress
export interface SubLectureProgressType {
    subLectureId: string;
    viewed: boolean;
}

// Define an interface for LectureProgress
export interface LectureProgressType {
    lectureId: string;
    viewed: boolean;
    subLectureProgress: SubLectureProgressType[]; // ✅ Added sub-lecture progress tracking
}

// Define an interface for CourseProgress
export interface CourseProgressType extends Document {
    userId: string;
    courseId: string;
    completed: boolean;
    lectureProgress: LectureProgressType[];
    progressPercentage: number;
}

// Create the subLectureProgressSchema
const subLectureProgressSchema = new Schema<SubLectureProgressType>({
    subLectureId: { type: String, required: true },
    viewed: { type: Boolean, required: true, default: false },
});

// Create the lectureProgressSchema
const lectureProgressSchema = new Schema<LectureProgressType>({
    lectureId: { type: String, required: true },
    viewed: { type: Boolean, required: true, default: false },
    subLectureProgress: { type: [subLectureProgressSchema], default: [] }, // ✅ Added sub-lecture progress
});

// Create the courseProgressSchema
const courseProgressSchema = new Schema<CourseProgressType>({
    userId: { type: String, required: true },
    courseId: { type: String, required: true },
    completed: { type: Boolean, required: true, default: false },
    lectureProgress: { type: [lectureProgressSchema], default: [] },
    progressPercentage: { type: Number, default: 0 }, // ✅ Added progress percentage
});

// Export the CourseProgress model
export const CourseProgress: Model<CourseProgressType> = mongoose.model<CourseProgressType>(
    "CourseProgress",
    courseProgressSchema
);
