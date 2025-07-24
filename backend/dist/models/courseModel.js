"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Course = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const courseSchema = new mongoose_1.default.Schema({
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
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    lectures: [
        {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "Lecture",
        },
    ],
    creator: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
    reviews: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Review" }],
    totalMinutes: {
        type: Number,
        default: 0,
    },
    totalHours: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });
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
exports.Course = mongoose_1.default.model("Course", courseSchema);
