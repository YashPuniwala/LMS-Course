"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Course = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const courseSchema = new mongoose_1.default.Schema({
    courseTitle: {
        type: String,
        required: true
    },
    isFree: {
        type: Boolean,
        default: false
    },
    subTitle: String,
    description: String,
    category: {
        type: String,
        required: true
    },
    courseLevel: {
        type: String,
        enum: ["Beginner", "Medium", "Advance"]
    },
    coursePrice: Number,
    courseThumbnail: String,
    enrolledStudents: [
        {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    lectures: [
        {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "Lecture"
        }
    ],
    creator: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User", // Ensure this matches the model name of your User schema
        required: true
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    tutorial: {
        videoUrl: String,
        publicId: String,
        tutorialDescription: String
    },
    totalMinutes: {
        type: Number,
        default: 0
    },
    totalHours: {
        type: Number,
        default: 0
    }
}, { timestamps: true });
courseSchema.virtual('duration').get(function () {
    return {
        hours: Math.floor(this.totalMinutes / 60),
        minutes: this.totalMinutes % 60
    };
});
// Virtual for formatted display
courseSchema.virtual('formattedDuration').get(function () {
    const hours = Math.floor(this.totalMinutes / 60);
    const minutes = this.totalMinutes % 60;
    return `${hours}h ${minutes}m`;
});
exports.Course = mongoose_1.default.model("Course", courseSchema);
