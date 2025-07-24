import { ParsedQs } from "qs";
import { NextFunction, Response } from "express";
import { Course } from "../models/courseModel";
import {
  AuthenticatedRequest,
  CreateCourseCustomRequest,
} from "../types/types";
import {
  deleteMediaFromCloudinary,
  deleteVideoFromCloudinary,
  uploadMedia,
} from "../utils/cloudinary";
import { Lecture, SubLecture } from "../models/lectureModel";
import mongoose, { Types } from "mongoose";
import { Review } from "../models/reviewModel";

const calculateTotalDuration = (
  items: { duration?: { hours: number; minutes: number } }[]
) => {
  let totalMinutes = 0;

  items.forEach((item) => {
    if (item.duration) {
      // Convert hours to minutes and add to total
      totalMinutes += item.duration.hours * 60 + item.duration.minutes;
    }
  });

  // Calculate hours (whole number) and remaining minutes (0-59)
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return {
    totalMinutes,
    totalHours: parseFloat((totalMinutes / 60).toFixed(2)), // Keep decimal for totalHours
    duration: {
      hours, // Whole hours only
      minutes, // 0-59 minutes only
    },
  };
};

const updateCourseDuration = async (lectureId: string) => {
  // Find the course containing this lecture
  const course = await Course.findOne({ lectures: lectureId });
  if (!course) return;

  // Get all lectures for this course
  const lectures = await Lecture.find({ _id: { $in: course.lectures } });

  // Calculate total duration from all sub-lectures across all lectures
  const allSubLectures = lectures.flatMap((lecture) => lecture.subLectures);
  const courseDuration = calculateTotalDuration(allSubLectures);

  // Update the course with new duration info
  await Course.findByIdAndUpdate(course._id, {
    totalMinutes: courseDuration.totalMinutes,
    totalHours: courseDuration.totalHours,
    totalDuration: courseDuration.duration,
  });
};

export const createCourse = async (
  req: CreateCourseCustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { courseTitle, isFree, category } = req.body;

    if (!courseTitle || !category) {
      res.status(400).json({
        success: false,
        message: "Course title and category are required",
      });
      return; // Ensure no further code is executed
    }

    await Course.create({
      courseTitle,
      isFree,
      category,
      creator: req.user?._id || req.id,
    });

    console.log("req.id:", req.id);
    console.log("req.user:", req.user);

    res.status(201).json({
      success: true,
      message: "Course created",
    });
  } catch (error) {
    console.error("Create Course Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create the course.",
    });
  }
};

export const searchCourse = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { query = "", sortBy = "createdAt", categories = "" } = req.query;

    const sortFields = typeof sortBy === "string" ? sortBy.split(",") : [];

    const sortOptions = sortFields.reduce<{ [key: string]: 1 | -1 }>(
      (acc, field) => {
        let sortOrder: 1 | -1 = 1; // Explicitly type sortOrder as 1 or -1

        if (field.startsWith("-")) {
          sortOrder = -1;
        }

        const fieldName = field.replace(/^-/, "");

        if (fieldName === "price") {
          acc.coursePrice = sortOrder;
        } else if (fieldName === "title") {
          acc.courseTitle = sortOrder;
        } else if (fieldName === "createdAt") {
          acc.createdAt = sortOrder;
        } else {
          acc[fieldName] = sortOrder;
        }

        return acc;
      },
      {}
    );

    const searchCriteria: Record<string, any> = {
      isPublished: true,
      $or: [
        { courseTitle: { $regex: query, $options: "i" } },
        { subTitle: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
      ],
    };

    if (categories) {
      let categoryArray: string[] = [];

      // Check if categories is a string or an array of strings
      if (typeof categories === "string") {
        categoryArray = categories.split(",");
      } else if (Array.isArray(categories)) {
        // If categories is an array, ensure it contains strings
        categoryArray = categories.map((cat) => String(cat));
      } else if (Array.isArray(categories) && categories[0] instanceof Object) {
        // Handle case if categories contains ParsedQs[]
        categoryArray = (categories as ParsedQs[]).map((cat) => String(cat));
      }

      searchCriteria.category = { $in: categoryArray };
    }

    // Fetch the courses from the database and apply sorting
    const courses = await Course.find(searchCriteria)
      .populate({ path: "creator", select: "name photoUrl" })
      .sort(sortOptions);

    // Return the courses in the response
    res.status(200).json({
      success: true,
      courses: courses || [],
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getAllAdminCourses = async (
  req: CreateCourseCustomRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id || req.id;
    const courses = await Course.find({ creator: userId });

    if (!courses || courses.length === 0) {
      res.status(404).json({
        courses: [],
        message: "Course not found",
      });
      return;
    }

    res.status(200).json({ courses });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch courses",
    });
  }
};

export const getCourseById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const courseId = req.params.courseId;
    const course = await Course.findById(courseId)
      .populate({
        path: "reviews",
        populate: {
          path: "user",
          select: "name photoUrl",
        },
      })
      .populate("creator", "name photoUrl");

    if (!course) {
      res.status(404).json({
        success: false,
        message: "Course not found!",
      });
      return;
    }

    res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Failed to get course by Id",
    });
  }
};

export const editCourse = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const courseId = req.params.courseId;
    const {
      courseTitle,
      isFree,
      subTitle,
      description,
      category,
      courseLevel,
      coursePrice,
      tutorialDescription,
    } = req.body;

    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    // ✅ Extract files correctly when using fields()
    const thumbnail = files?.courseThumbnail?.[0];
    const tutorialVideo = files?.tutorialVideo?.[0];

    let course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({
        success: false,
        message: "Course not found!",
      });
      return;
    }

    let courseThumbnail;
    if (thumbnail) {
      // Delete old thumbnail from Cloudinary if it exists
      if (course.courseThumbnail) {
        const publicId = course.courseThumbnail.split("/").pop()?.split(".")[0];
        if (publicId) {
          await deleteMediaFromCloudinary(publicId);
        }
      }

      // Upload new thumbnail to Cloudinary
      courseThumbnail = await uploadMedia(thumbnail.path);
    }

    let tutorial = { ...course.tutorial };

    // ✅ Handle tutorial video upload
    if (tutorialVideo) {
      // Delete old tutorial video if it exists
      if (tutorial.videoUrl) {
        const oldPublicId = tutorial.publicId;
        if (oldPublicId) {
          await deleteMediaFromCloudinary(oldPublicId);
        }
      }

      // Upload new tutorial video to Cloudinary
      const uploadedTutorial = await uploadMedia(tutorialVideo.path);
      tutorial.videoUrl = uploadedTutorial?.secure_url;
      tutorial.publicId = uploadedTutorial?.public_id;
    }

    if (tutorialDescription) {
      tutorial.tutorialDescription = tutorialDescription;
    }

    const updatedData = {
      courseTitle,
      isFree,
      subTitle,
      description,
      category,
      courseLevel,
      coursePrice,
      courseThumbnail: courseThumbnail?.secure_url || course.courseThumbnail,
      tutorial, // ✅ Update tutorial object
    };

    course = await Course.findByIdAndUpdate(courseId, updatedData, {
      new: true,
    });

    res
      .status(200)
      .json({ success: true, message: "Course updated successfully" });
    return;
  } catch (error) {
    console.error("Error updating course:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update course" });
    return;
  }
};

export const createLecture = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const courseId = req.params.courseId;
    const { lectureTitle } = req.body;

    if (!lectureTitle || !courseId) {
      res.status(400).json({
        success: false,
        message: "Lecture title and course ID are required.",
      });
      return;
    }

    // Create the new lecture with course reference
    const lecture = await Lecture.create({ 
      lectureTitle,
      course: courseId,
      subLectures: [] // Initialize with empty subLectures
    });

    // Find the course by ID and update
    const course = await Course.findByIdAndUpdate(
      courseId,
      { $push: { lectures: lecture._id } },
      { new: true }
    );

    if (!course) {
      // Rollback lecture creation if course not found
      await Lecture.findByIdAndDelete(lecture._id);
      res.status(404).json({
        success: false,
        message: "Course not found.",
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: "Lecture created successfully.",
      lecture,
    });
  } catch (error: any) {
    console.error("Error creating lecture:", error);
    
    if (error instanceof mongoose.Error.ValidationError) {
      res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to create lecture.",
    });
  }
};

export const createSubLecture = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { lectureId } = req.params;
    const { subLectureTitle, hours = 0, minutes = 0 } = req.body;

    if (!lectureId || !subLectureTitle) {
      res.status(400).json({
        success: false,
        message: "Lecture ID and sub-lecture title are required.",
      });
      return;
    }

    // Handle video upload
    let videoUrl = "";
    let publicId = "";
    if (req.file) {
      const uploadResponse = await uploadMedia(req.file.path);
      if (uploadResponse) {
        videoUrl = uploadResponse.secure_url;
        publicId = uploadResponse.public_id;
      }
    } else {
      res.status(400).json({
        success: false,
        message: "Video file is required.",
      });
      return;
    }

    // Create new sub-lecture with duration
    const newSubLecture = {
      subLectureTitle,
      videoUrl,
      publicId,
      duration: {
        hours: parseInt(hours) || 0,
        minutes: parseInt(minutes) || 0,
      },
    };

    // Add sub-lecture to lecture
    const lecture = await Lecture.findByIdAndUpdate(
      lectureId,
      { $push: { subLectures: newSubLecture } },
      { new: true }
    );

    if (!lecture) {
      res.status(404).json({
        success: false,
        message: "Lecture not found.",
      });
      return;
    }

    // Calculate updated lecture duration
    const lectureDuration = calculateTotalDuration(lecture.subLectures);

    // Update lecture with new duration info
    await Lecture.findByIdAndUpdate(lectureId, {
      totalMinutes: lectureDuration.totalMinutes,
      totalHours: lectureDuration.totalHours,
      totalDuration: lectureDuration.duration,
    });

    // Update course duration
    await updateCourseDuration(lectureId);

    res.status(201).json({
      success: true,
      message: "Sub-lecture created successfully.",
      subLecture: newSubLecture,
      duration: lectureDuration.duration,
    });
  } catch (error) {
    console.error("Error creating sub-lecture:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create sub-lecture.",
    });
  }
};

export const getSingleLectureSubLectures = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { lectureId } = req.params;

    // ✅ Validate input
    if (!lectureId) {
      res.status(400).json({
        success: false,
        message: "Lecture ID is required.",
      });
      return;
    }

    // ✅ Find the lecture by ID
    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      res.status(404).json({
        success: false,
        message: "Lecture not found.",
      });
      return;
    }

    // ✅ Return sub-lectures of the lecture
    res.status(200).json({
      success: true,
      subLectures: lecture.subLectures,
    });
  } catch (error) {
    console.error("Error fetching sub-lectures:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch sub-lectures.",
    });
  }
};

export const getCourseLecture = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const courseId = req.params.courseId;
    const course = await Course.findById(courseId).populate("lectures");
    if (!course) {
      res.status(404).json({
        success: false,
        message: "Course not found!",
      });
      return;
    }
    res.status(200).json({
      success: true,
      lectures: course.lectures,
    });
  } catch (error) {
    console.error("Error creating lecture:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get course lecture.",
    });
    return;
  }
};

export const editLecture = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { lectureTitle } = req.body;
    const { courseId, lectureId } = req.params;

    console.log("Received IDs:", { courseId, lectureId, lectureTitle });

    // 1. First verify the course exists
    const course = await Course.findById(courseId);
    if (!course) {
      console.log("Course not found");
      res.status(404).json({
        success: false,
        message: "Course not found!",
      });
      return;
    }

    // 2. Check if lecture exists in this course
    const lectureExistsInCourse = course.lectures.some(
      (lecture) => lecture.toString() === lectureId
    );

    if (!lectureExistsInCourse) {
      console.log(
        "Lecture not found in course. Course lectures:",
        course.lectures
      );
      res.status(404).json({
        success: false,
        message: "Lecture not found in this course!",
      });
      return;
    }

    // 3. Find and update the lecture
    const lecture = await Lecture.findByIdAndUpdate(
      lectureId,
      { lectureTitle },
      { new: true }
    );

    if (!lecture) {
      console.log("Lecture document not found");
      res.status(404).json({
        success: false,
        message: "Lecture document not found!",
      });
      return;
    }

    console.log("Successfully updated lecture:", lecture);
    res.status(200).json({
      success: true,
      message: "Lecture updated successfully.",
      lecture,
    });
  } catch (error) {
    console.error("Error editing lecture:", error);
    res.status(500).json({
      success: false,
      message: "Failed to edit lecture.",
    });
  }
};

export const editSubLecture = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { lectureId, subLectureId } = req.params;
    const { subLectureTitle, hours, minutes } = req.body;

    // Find the parent lecture
    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      res.status(404).json({
        success: false,
        message: "Lecture not found!",
      });
      return;
    }

    // Find the sub-lecture
    const subLecture = lecture.subLectures.id(subLectureId);
    if (!subLecture) {
      res.status(404).json({
        success: false,
        message: "Sub-lecture not found!",
      });
      return;
    }

    // Handle video upload if file is provided
    if (req.file) {
      if (subLecture.publicId) {
        await deleteVideoFromCloudinary(subLecture.publicId);
      }
      const uploadResponse = await uploadMedia(req.file.path);
      if (uploadResponse) {
        subLecture.videoUrl = uploadResponse.secure_url;
        subLecture.publicId = uploadResponse.public_id;
      }
    }

    // Update fields
    if (subLectureTitle) subLecture.subLectureTitle = subLectureTitle;

    // Update duration if provided
    if (hours !== undefined || minutes !== undefined) {
      subLecture.duration = {
        hours:
          hours !== undefined ? parseInt(hours) : subLecture.duration.hours,
        minutes:
          minutes !== undefined
            ? parseInt(minutes)
            : subLecture.duration.minutes,
      };
    }

    // Save the lecture
    await lecture.save();

    // Calculate updated lecture duration
    const lectureDuration = calculateTotalDuration(lecture.subLectures);

    // Update lecture with new duration info
    await Lecture.findByIdAndUpdate(lectureId, {
      totalMinutes: lectureDuration.totalMinutes,
      totalHours: lectureDuration.totalHours,
      totalDuration: lectureDuration.duration,
    });

    // Update course duration
    await updateCourseDuration(lectureId);

    res.status(200).json({
      success: true,
      message: "Sub-lecture updated successfully.",
      subLecture,
      duration: lectureDuration.duration,
    });
  } catch (error) {
    console.error("Error editing sub-lecture:", error);
    res.status(500).json({
      success: false,
      message: "Failed to edit sub-lecture.",
    });
  }
};

export const removeLecture = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { lectureId } = req.params;

    // ✅ Find the parent lecture
    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      res.status(404).json({
        success: false,
        message: "Lecture not found!",
      });
      return;
    }

    // ✅ Delete all sub-lectures and their videos from Cloudinary
    if (lecture.subLectures && lecture.subLectures.length > 0) {
      for (const subLecture of lecture.subLectures) {
        if (subLecture.publicId) {
          await deleteVideoFromCloudinary(subLecture.publicId);
        }
      }
    }

    // ✅ Remove the lecture itself
    await Lecture.findByIdAndDelete(lectureId);

    // ✅ Remove the lecture ID from the course
    await Course.updateOne(
      { lectures: lectureId },
      { $pull: { lectures: lectureId } }
    );

    res.status(200).json({
      success: true,
      message: "Lecture and sub-lectures removed successfully",
    });
  } catch (error) {
    console.error("Error removing lecture:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove lecture",
    });
  }
};

export const removeSubLecture = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { lectureId, subLectureId } = req.params;

    // Find the parent lecture
    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      res.status(404).json({
        success: false,
        message: "Lecture not found!",
      });
      return;
    }

    // Find the sub-lecture
    const subLecture = lecture.subLectures.id(subLectureId);
    if (!subLecture) {
      res.status(404).json({
        success: false,
        message: "Sub-lecture not found!",
      });
      return;
    }

    // Delete video from Cloudinary if exists
    if (subLecture.publicId) {
      await deleteVideoFromCloudinary(subLecture.publicId);
    }

    // Remove the sub-lecture
    lecture.subLectures.pull(subLectureId);
    await lecture.save();

    // Calculate updated lecture duration
    const lectureDuration = calculateTotalDuration(lecture.subLectures);

    // Update lecture with new duration info
    await Lecture.findByIdAndUpdate(lectureId, {
      totalMinutes: lectureDuration.totalMinutes,
      totalHours: lectureDuration.totalHours,
      totalDuration: lectureDuration.duration,
    });

    // Update course duration
    await updateCourseDuration(lectureId);

    res.status(200).json({
      success: true,
      message: "Sub-lecture removed successfully",
    });
  } catch (error) {
    console.error("Error removing sub-lecture:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove sub-lecture",
    });
  }
};

export const getLectureById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { lectureId } = req.params;
    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      res.status(404).json({
        message: "Lecture not found!",
      });
      return;
    }
    res.status(200).json({
      lecture,
    });
    return;
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Failed to get lecture by id",
    });
    return;
  }
};

export const togglePublicCourse = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { courseId } = req.params;
    const { publish } = req.query;
    const course = await Course.findById(courseId);

    if (!course) {
      res.status(404).json({
        success: false,
        message: "Course not found!",
      });
      return;
    }

    if (
      !course.courseLevel ||
      !["Beginner", "Medium", "Advance"].includes(course.courseLevel)
    ) {
      course.courseLevel = "Beginner"; // Set to default if undefined or invalid
    }

    course.isPublished = publish === "true";
    await course.save();

    const statusMessage = course.isPublished ? "Published" : "Unpublished";
    res.status(200).json({
      message: `Course is ${statusMessage}`,
    });
    console.log(statusMessage, "statusMessage");
    console.log(course, "course");
    return;
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Failed to update status",
    });
    return;
  }
};

export const getPublishedCourse = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const courses = await Course.find({ isPublished: true }).populate({
      path: "creator",
      select: "name photoUrl email role",
    });
    if (!courses) {
      res.status(404).json({
        message: "Course not found",
      });
      return;
    }
    res.status(200).json({
      courses,
    });
    return;
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Failed to get published courses",
    });
    return;
  }
};

export const removeCourse = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { courseId } = req.params;

    // Find the course first
    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({
        success: false,
        message: "Course not found!",
      });
      return;
    }

    // Delete course thumbnail from Cloudinary if exists
    if (course.courseThumbnail) {
      const publicId = course.courseThumbnail.split("/").pop()?.split(".")[0];
      if (publicId) {
        await deleteMediaFromCloudinary(publicId);
      }
    }

    // Delete tutorial video from Cloudinary if exists
    if (course.tutorial?.publicId) {
      await deleteMediaFromCloudinary(course.tutorial.publicId);
    }

    // Find and delete all lectures associated with this course
    const lectures = await Lecture.find({ _id: { $in: course.lectures } });

    for (const lecture of lectures) {
      // Delete videos of all sublectures
      if (lecture.subLectures && lecture.subLectures.length > 0) {
        for (const subLecture of lecture.subLectures) {
          if (subLecture.publicId) {
            await deleteVideoFromCloudinary(subLecture.publicId);
          }
        }
      }

      // Delete the lecture
      await Lecture.findByIdAndDelete(lecture._id);
    }
    await Review.deleteMany({ course: courseId });

    // Finally, delete the course
    await Course.findByIdAndDelete(courseId);

    res.status(200).json({
      success: true,
      message: "Course and all associated content removed successfully",
    });
  } catch (error) {
    console.error("Error removing course:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove course",
    });
  }
};
