import mongoose, { Schema, Document, Model } from "mongoose";

export interface UserType extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: "instructor" | "student";
  enrolledCourses: mongoose.Types.ObjectId[];
  photoUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema: Schema<UserType> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["instructor", "student"],
      default: "student",
    },
    enrolledCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    photoUrl: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export const User: Model<UserType> = mongoose.model<UserType>("User", userSchema);
