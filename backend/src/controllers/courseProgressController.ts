import { Request, Response } from "express";
import { AuthenticatedRequest } from "../types/types";
import { CourseProgress, CourseProgressType, LectureProgressType, SubLectureProgressType } from "../models/courseProgressModel";
import { Course } from "../models/courseModel";
import { LectureType } from "../models/lectureModel";

const calculateProgressPercentage = (courseProgress: CourseProgressType, course: any): number => {
    if (!course || !course.lectures) return 0;

    // Calculate total sub-lectures in the course
    const totalSubLectures = course.lectures.reduce((count: number, lecture: any) => {
        return count + (lecture.subLectures?.length || 0);
    }, 0);

    if (totalSubLectures === 0) return 0;

    // Calculate completed sub-lectures
    const completedSubLectures = courseProgress.lectureProgress.reduce((count: number, lecture: LectureProgressType) => {
        return count + lecture.subLectureProgress.filter((sub) => sub.viewed).length;
    }, 0);

    // Calculate percentage
    const progressPercentage = Math.round((completedSubLectures / totalSubLectures) * 100);
    return progressPercentage;
};

export const getCourseProgress = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { courseId } = req.params;
        const userId = req.user?._id;

        let courseProgress = await CourseProgress.findOne({ courseId, userId })
            .populate({
                path: "courseId",
                populate: { path: "lectures", populate: { path: "subLectures" } },
            });

        const courseDetails = await Course.findById(courseId).populate({
            path: "lectures",
            populate: { path: "subLectures" },
        });

        if (!courseDetails) {
            res.status(404).json({ success: false, message: "Course not found!" });
            return;
        }

        if (!courseProgress) {
            res.status(200).json({
                data: { courseDetails, progress: [], completed: false, progressPercentage: 0 }, // Default to 0 if no progress exists
            });
            return;
        }

        res.status(200).json({
            data: {
                courseDetails,
                progress: courseProgress.lectureProgress,
                completed: courseProgress.completed,
                progressPercentage: courseProgress.progressPercentage, // Ensure this is returned
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const updateLectureProgress = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { courseId, lectureId, subLectureId } = req.params;
        const userId = req.user?._id;

        let courseProgress = await CourseProgress.findOne({ courseId, userId });

        if (!courseProgress) {
            courseProgress = new CourseProgress({
                userId,
                courseId,
                completed: false,
                lectureProgress: [],
                progressPercentage: 0, // Initialize progress percentage
            });
        }

        // Find lecture inside courseProgress
        let lectureProgress = courseProgress.lectureProgress.find(
            (lecture) => lecture.lectureId === lectureId
        );

        if (!lectureProgress) {
            lectureProgress = { lectureId, viewed: false, subLectureProgress: [] };
            courseProgress.lectureProgress.push(lectureProgress);
        }

        // Find sub-lecture inside lectureProgress
        let subLectureProgress = lectureProgress.subLectureProgress.find(
            (sub) => sub.subLectureId === subLectureId
        );

        if (!subLectureProgress) {
            subLectureProgress = { subLectureId, viewed: true };
            lectureProgress.subLectureProgress.push(subLectureProgress);
        } else {
            subLectureProgress.viewed = true;
        }

        // Check if all sub-lectures are completed for this lecture
        const course = await Course.findById(courseId).populate({
            path: "lectures",
            populate: { path: "subLectures" },
        });

        if (course) {
            // Find the current lecture in the course
            const currentLecture = course.lectures.find((lecture) => {
                return lecture._id?.toString() === lectureId;
            });

            if (currentLecture) {
                const typedLecture = currentLecture as unknown as LectureType;
                const totalLectureSubLectures = typedLecture.subLectures?.length || 0;
                const completedLectureSubLectures = lectureProgress.subLectureProgress.filter(
                    (sub) => sub.viewed
                ).length;

                // Mark lecture as viewed if all sub-lectures are viewed
                if (totalLectureSubLectures > 0 && completedLectureSubLectures === totalLectureSubLectures) {
                    lectureProgress.viewed = true;
                }
            }

            // Calculate progress percentage
            courseProgress.progressPercentage = calculateProgressPercentage(courseProgress, course);

            // Check course completion status
            const totalSubLectures = course.lectures.reduce((count, lecture) => {
                const lectureData = lecture as unknown as LectureType;
                return count + (lectureData.subLectures?.length || 0);
            }, 0);

            const completedSubLectures = courseProgress.lectureProgress.reduce(
                (count, lecture) => count + lecture.subLectureProgress.filter((sub) => sub.viewed).length,
                0
            );

            courseProgress.completed = completedSubLectures === totalSubLectures;
        }

        await courseProgress.save();

        res.status(200).json({
            success: true,
            message: "Sub-lecture progress updated successfully!",
            progressPercentage: courseProgress.progressPercentage, // Return progress percentage
        });
        return;
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const markAsCompleted = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { courseId } = req.params;
        const userId = req.user?._id;

        const courseProgress = await CourseProgress.findOne({ courseId, userId });
        if (!courseProgress) {
            res.status(404).json({ success: false, message: "Course Progress not found" });
            return;
        }

        // Mark all lectures and sub-lectures as completed
        courseProgress.lectureProgress.forEach((lecture) => {
            lecture.viewed = true;
            lecture.subLectureProgress.forEach((sub) => (sub.viewed = true));
        });

        // Set the course as completed
        courseProgress.completed = true;

        // Set progressPercentage to 100%
        courseProgress.progressPercentage = 100;

        await courseProgress.save();

        res.status(200).json({ 
            success: true, 
            message: "Course marked as completed", 
            progressPercentage: courseProgress.progressPercentage 
        });
        return;
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const markAsInCompleted = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { courseId } = req.params;
        const userId = req.user?._id;

        const courseProgress = await CourseProgress.findOne({ courseId, userId });
        if (!courseProgress) {
            res.status(404).json({ success: false, message: "Course Progress not found" });
            return;
        }

        // Mark all lectures and sub-lectures as incomplete
        courseProgress.lectureProgress.forEach((lecture) => {
            lecture.viewed = false;
            lecture.subLectureProgress.forEach((sub) => (sub.viewed = false));
        });

        // Set the course as incomplete
        courseProgress.completed = false;

        // Set progressPercentage to 0%
        courseProgress.progressPercentage = 0;

        await courseProgress.save();

        res.status(200).json({ 
            success: true, 
            message: "Course marked as incomplete", 
            progressPercentage: courseProgress.progressPercentage 
        });
        return;
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};