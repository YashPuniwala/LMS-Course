import mongoose, { Document, Schema, Types } from "mongoose";

// Sub-Lecture Type
export interface SubLectureType extends Document {
  subLectureTitle: string;
  videoUrl?: string;
  publicId?: string;
  duration: {
    hours: number;
    minutes: number;
  };
  
}

export interface LectureType extends Document {
  lectureTitle: string;
  subLectures: Types.DocumentArray<SubLectureType>; // Changed from SubLectureType[]
  totalDuration: {
    hours: number;
    minutes: number;
  };
  course: Types.ObjectId;
  totalMinutes: number; // Total minutes for all sub-lectures
  totalHours: number;   // Total hours (decimal) for all sub-lectures
}

// Sub-Lecture Schema
const subLectureSchema = new Schema<SubLectureType>(
  {
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
  },
  { timestamps: true }
);

// Virtual to calculate minutes for a single sub-lecture
subLectureSchema.virtual('minutes').get(function() {
  return (this.duration.hours * 60) + this.duration.minutes;
});

// Lecture Schema
const lectureSchema = new Schema<LectureType>(
  {
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
      type: Schema.Types.ObjectId,
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
  },
  { timestamps: true }
);

// Pre-save hook for Lecture to calculate totals
lectureSchema.pre<LectureType>("save", function(next) {
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
lectureSchema.virtual('formattedDuration').get(function() {
  return `${this.totalDuration.hours}h ${this.totalDuration.minutes}m`;
});

subLectureSchema.virtual('formattedDuration').get(function() {
  return `${this.duration.hours}h ${this.duration.minutes}m`;
});

export const Lecture = mongoose.model<LectureType>("Lecture", lectureSchema);
export const SubLecture = mongoose.model<SubLectureType>("SubLecture", subLectureSchema);