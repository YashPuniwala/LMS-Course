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
exports.SubLecture = exports.Lecture = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Sub-Lecture Schema
const subLectureSchema = new mongoose_1.Schema({
    subLectureTitle: {
        type: String,
        required: true,
    },
    videoUrl: {
        type: String,
    },
    publicId: {
        type: String,
    },
    duration: {
        type: {
            hours: { type: Number, default: 0, min: 0 },
            minutes: { type: Number, default: 0, min: 0, max: 59 }
        },
        required: true,
        default: { hours: 0, minutes: 0 }
    }
}, { timestamps: true });
// Virtual to calculate minutes for a single sub-lecture
subLectureSchema.virtual('minutes').get(function () {
    return (this.duration.hours * 60) + this.duration.minutes;
});
// Lecture Schema
const lectureSchema = new mongoose_1.Schema({
    lectureTitle: {
        type: String,
        required: true,
    },
    subLectures: [subLectureSchema],
    totalDuration: {
        type: {
            hours: { type: Number, default: 0 },
            minutes: { type: Number, default: 0, min: 0, max: 59 }
        },
        default: { hours: 0, minutes: 0 }
    },
    course: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
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
// Pre-save hook for Lecture to calculate totals
lectureSchema.pre("save", function (next) {
    if (this.subLectures && this.subLectures.length > 0) {
        // Calculate total minutes from all sub-lectures
        const totalMins = this.subLectures.reduce((sum, sub) => {
            const subMinutes = (sub.duration.hours * 60) + sub.duration.minutes;
            return sum + subMinutes;
        }, 0);
        this.totalMinutes = totalMins;
        this.totalHours = parseFloat((totalMins / 60).toFixed(2));
        // Convert back to hours and minutes for display
        this.totalDuration = {
            hours: Math.floor(totalMins / 60),
            minutes: totalMins % 60
        };
    }
    next();
});
// Virtual for formatted duration display
lectureSchema.virtual('formattedDuration').get(function () {
    return `${this.totalDuration.hours}h ${this.totalDuration.minutes}m`;
});
subLectureSchema.virtual('formattedDuration').get(function () {
    return `${this.duration.hours}h ${this.duration.minutes}m`;
});
exports.Lecture = mongoose_1.default.model("Lecture", lectureSchema);
exports.SubLecture = mongoose_1.default.model("SubLecture", subLectureSchema);
