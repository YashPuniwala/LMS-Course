// models/coursePurchaseModel.ts
import mongoose, { Document, Schema } from 'mongoose';
import { CourseType } from './courseModel';

interface CoursePurchaseType extends Document {
    courseId: CourseType;
    userId: mongoose.Schema.Types.ObjectId;
    amount: number;
    status: 'pending' | 'completed' | 'failed' | 'free';
    paymentId?: string;  // Make paymentId optional
    createdAt: Date;
    updatedAt: Date;
}

const coursePurchaseSchema = new Schema<CoursePurchaseType>({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        default: 0
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'free'],
        default: 'pending'
    },
    paymentId: {
        type: String,
        required: false // No longer required
    }
}, { timestamps: true });

export const CoursePurchase = mongoose.model<CoursePurchaseType>('CoursePurchase', coursePurchaseSchema);