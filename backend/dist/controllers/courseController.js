"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeCourse = exports.getPublishedCourse = exports.togglePublicCourse = exports.getLectureById = exports.removeSubLecture = exports.removeLecture = exports.editSubLecture = exports.editLecture = exports.getCourseLecture = exports.getSingleLectureSubLectures = exports.createSubLecture = exports.createLecture = exports.editCourse = exports.getCourseById = exports.getAllAdminCourses = exports.searchCourse = exports.createCourse = void 0;
const courseModel_1 = require("../models/courseModel");
const cloudinary_1 = require("../utils/cloudinary");
const lectureModel_1 = require("../models/lectureModel");
const mongoose_1 = __importDefault(require("mongoose"));
const reviewModel_1 = require("../models/reviewModel");
const calculateTotalDuration = (items) => {
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
const updateCourseDuration = (lectureId) => __awaiter(void 0, void 0, void 0, function* () {
    // Find the course containing this lecture
    const course = yield courseModel_1.Course.findOne({ lectures: lectureId });
    if (!course)
        return;
    // Get all lectures for this course
    const lectures = yield lectureModel_1.Lecture.find({ _id: { $in: course.lectures } });
    // Calculate total duration from all sub-lectures across all lectures
    const allSubLectures = lectures.flatMap((lecture) => lecture.subLectures);
    const courseDuration = calculateTotalDuration(allSubLectures);
    // Update the course with new duration info
    yield courseModel_1.Course.findByIdAndUpdate(course._id, {
        totalMinutes: courseDuration.totalMinutes,
        totalHours: courseDuration.totalHours,
        totalDuration: courseDuration.duration,
    });
});
const createCourse = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { courseTitle, isFree, category } = req.body;
        if (!courseTitle || !category) {
            res.status(400).json({
                success: false,
                message: "Course title and category are required",
            });
            return; // Ensure no further code is executed
        }
        yield courseModel_1.Course.create({
            courseTitle,
            isFree,
            category,
            creator: ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || req.id,
        });
        console.log("req.id:", req.id);
        console.log("req.user:", req.user);
        res.status(201).json({
            success: true,
            message: "Course created",
        });
    }
    catch (error) {
        console.error("Create Course Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create the course.",
        });
    }
});
exports.createCourse = createCourse;
const searchCourse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { query = "", sortBy = "createdAt", categories = "" } = req.query;
        const sortFields = typeof sortBy === "string" ? sortBy.split(",") : [];
        const sortOptions = sortFields.reduce((acc, field) => {
            let sortOrder = 1; // Explicitly type sortOrder as 1 or -1
            if (field.startsWith("-")) {
                sortOrder = -1;
            }
            const fieldName = field.replace(/^-/, "");
            if (fieldName === "price") {
                acc.coursePrice = sortOrder;
            }
            else if (fieldName === "title") {
                acc.courseTitle = sortOrder;
            }
            else if (fieldName === "createdAt") {
                acc.createdAt = sortOrder;
            }
            else {
                acc[fieldName] = sortOrder;
            }
            return acc;
        }, {});
        const searchCriteria = {
            isPublished: true,
            $or: [
                { courseTitle: { $regex: query, $options: "i" } },
                { subTitle: { $regex: query, $options: "i" } },
                { category: { $regex: query, $options: "i" } },
            ],
        };
        if (categories) {
            let categoryArray = [];
            // Check if categories is a string or an array of strings
            if (typeof categories === "string") {
                categoryArray = categories.split(",");
            }
            else if (Array.isArray(categories)) {
                // If categories is an array, ensure it contains strings
                categoryArray = categories.map((cat) => String(cat));
            }
            else if (Array.isArray(categories) && categories[0] instanceof Object) {
                // Handle case if categories contains ParsedQs[]
                categoryArray = categories.map((cat) => String(cat));
            }
            searchCriteria.category = { $in: categoryArray };
        }
        // Fetch the courses from the database and apply sorting
        const courses = yield courseModel_1.Course.find(searchCriteria)
            .populate({ path: "creator", select: "name photoUrl" })
            .sort(sortOptions);
        // Return the courses in the response
        res.status(200).json({
            success: true,
            courses: courses || [],
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});
exports.searchCourse = searchCourse;
const getAllAdminCourses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || req.id;
        const courses = yield courseModel_1.Course.find({ creator: userId });
        if (!courses || courses.length === 0) {
            res.status(404).json({
                courses: [],
                message: "Course not found",
            });
            return;
        }
        res.status(200).json({ courses });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch courses",
        });
    }
});
exports.getAllAdminCourses = getAllAdminCourses;
const getCourseById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const courseId = req.params.courseId;
        const course = yield courseModel_1.Course.findById(courseId)
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
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Failed to get course by Id",
        });
    }
});
exports.getCourseById = getCourseById;
const editCourse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const courseId = req.params.courseId;
        const { courseTitle, isFree, subTitle, description, category, courseLevel, coursePrice, tutorialDescription, } = req.body;
        const files = req.files;
        // ✅ Extract files correctly when using fields()
        const thumbnail = (_a = files === null || files === void 0 ? void 0 : files.courseThumbnail) === null || _a === void 0 ? void 0 : _a[0];
        const tutorialVideo = (_b = files === null || files === void 0 ? void 0 : files.tutorialVideo) === null || _b === void 0 ? void 0 : _b[0];
        let course = yield courseModel_1.Course.findById(courseId);
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
                const publicId = (_c = course.courseThumbnail.split("/").pop()) === null || _c === void 0 ? void 0 : _c.split(".")[0];
                if (publicId) {
                    yield (0, cloudinary_1.deleteMediaFromCloudinary)(publicId);
                }
            }
            // Upload new thumbnail to Cloudinary
            courseThumbnail = yield (0, cloudinary_1.uploadMedia)(thumbnail.path);
        }
        let tutorial = Object.assign({}, course.tutorial);
        // ✅ Handle tutorial video upload
        if (tutorialVideo) {
            // Delete old tutorial video if it exists
            if (tutorial.videoUrl) {
                const oldPublicId = tutorial.publicId;
                if (oldPublicId) {
                    yield (0, cloudinary_1.deleteMediaFromCloudinary)(oldPublicId);
                }
            }
            // Upload new tutorial video to Cloudinary
            const uploadedTutorial = yield (0, cloudinary_1.uploadMedia)(tutorialVideo.path);
            tutorial.videoUrl = uploadedTutorial === null || uploadedTutorial === void 0 ? void 0 : uploadedTutorial.secure_url;
            tutorial.publicId = uploadedTutorial === null || uploadedTutorial === void 0 ? void 0 : uploadedTutorial.public_id;
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
            courseThumbnail: (courseThumbnail === null || courseThumbnail === void 0 ? void 0 : courseThumbnail.secure_url) || course.courseThumbnail,
            tutorial, // ✅ Update tutorial object
        };
        course = yield courseModel_1.Course.findByIdAndUpdate(courseId, updatedData, {
            new: true,
        });
        res
            .status(200)
            .json({ success: true, message: "Course updated successfully" });
        return;
    }
    catch (error) {
        console.error("Error updating course:", error);
        res
            .status(500)
            .json({ success: false, message: "Failed to update course" });
        return;
    }
});
exports.editCourse = editCourse;
const createLecture = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const lecture = yield lectureModel_1.Lecture.create({
            lectureTitle,
            course: courseId,
            subLectures: [] // Initialize with empty subLectures
        });
        // Find the course by ID and update
        const course = yield courseModel_1.Course.findByIdAndUpdate(courseId, { $push: { lectures: lecture._id } }, { new: true });
        if (!course) {
            // Rollback lecture creation if course not found
            yield lectureModel_1.Lecture.findByIdAndDelete(lecture._id);
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
    }
    catch (error) {
        console.error("Error creating lecture:", error);
        if (error instanceof mongoose_1.default.Error.ValidationError) {
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
});
exports.createLecture = createLecture;
const createSubLecture = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
            const uploadResponse = yield (0, cloudinary_1.uploadMedia)(req.file.path);
            if (uploadResponse) {
                videoUrl = uploadResponse.secure_url;
                publicId = uploadResponse.public_id;
            }
        }
        else {
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
        const lecture = yield lectureModel_1.Lecture.findByIdAndUpdate(lectureId, { $push: { subLectures: newSubLecture } }, { new: true });
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
        yield lectureModel_1.Lecture.findByIdAndUpdate(lectureId, {
            totalMinutes: lectureDuration.totalMinutes,
            totalHours: lectureDuration.totalHours,
            totalDuration: lectureDuration.duration,
        });
        // Update course duration
        yield updateCourseDuration(lectureId);
        res.status(201).json({
            success: true,
            message: "Sub-lecture created successfully.",
            subLecture: newSubLecture,
            duration: lectureDuration.duration,
        });
    }
    catch (error) {
        console.error("Error creating sub-lecture:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create sub-lecture.",
        });
    }
});
exports.createSubLecture = createSubLecture;
const getSingleLectureSubLectures = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const lecture = yield lectureModel_1.Lecture.findById(lectureId);
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
    }
    catch (error) {
        console.error("Error fetching sub-lectures:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch sub-lectures.",
        });
    }
});
exports.getSingleLectureSubLectures = getSingleLectureSubLectures;
const getCourseLecture = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const courseId = req.params.courseId;
        const course = yield courseModel_1.Course.findById(courseId).populate("lectures");
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
    }
    catch (error) {
        console.error("Error creating lecture:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get course lecture.",
        });
        return;
    }
});
exports.getCourseLecture = getCourseLecture;
const editLecture = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { lectureTitle } = req.body;
        const { courseId, lectureId } = req.params;
        console.log("Received IDs:", { courseId, lectureId, lectureTitle });
        // 1. First verify the course exists
        const course = yield courseModel_1.Course.findById(courseId);
        if (!course) {
            console.log("Course not found");
            res.status(404).json({
                success: false,
                message: "Course not found!",
            });
            return;
        }
        // 2. Check if lecture exists in this course
        const lectureExistsInCourse = course.lectures.some((lecture) => lecture.toString() === lectureId);
        if (!lectureExistsInCourse) {
            console.log("Lecture not found in course. Course lectures:", course.lectures);
            res.status(404).json({
                success: false,
                message: "Lecture not found in this course!",
            });
            return;
        }
        // 3. Find and update the lecture
        const lecture = yield lectureModel_1.Lecture.findByIdAndUpdate(lectureId, { lectureTitle }, { new: true });
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
    }
    catch (error) {
        console.error("Error editing lecture:", error);
        res.status(500).json({
            success: false,
            message: "Failed to edit lecture.",
        });
    }
});
exports.editLecture = editLecture;
const editSubLecture = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { lectureId, subLectureId } = req.params;
        const { subLectureTitle, hours, minutes } = req.body;
        // Find the parent lecture
        const lecture = yield lectureModel_1.Lecture.findById(lectureId);
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
                yield (0, cloudinary_1.deleteVideoFromCloudinary)(subLecture.publicId);
            }
            const uploadResponse = yield (0, cloudinary_1.uploadMedia)(req.file.path);
            if (uploadResponse) {
                subLecture.videoUrl = uploadResponse.secure_url;
                subLecture.publicId = uploadResponse.public_id;
            }
        }
        // Update fields
        if (subLectureTitle)
            subLecture.subLectureTitle = subLectureTitle;
        // Update duration if provided
        if (hours !== undefined || minutes !== undefined) {
            subLecture.duration = {
                hours: hours !== undefined ? parseInt(hours) : subLecture.duration.hours,
                minutes: minutes !== undefined
                    ? parseInt(minutes)
                    : subLecture.duration.minutes,
            };
        }
        // Save the lecture
        yield lecture.save();
        // Calculate updated lecture duration
        const lectureDuration = calculateTotalDuration(lecture.subLectures);
        // Update lecture with new duration info
        yield lectureModel_1.Lecture.findByIdAndUpdate(lectureId, {
            totalMinutes: lectureDuration.totalMinutes,
            totalHours: lectureDuration.totalHours,
            totalDuration: lectureDuration.duration,
        });
        // Update course duration
        yield updateCourseDuration(lectureId);
        res.status(200).json({
            success: true,
            message: "Sub-lecture updated successfully.",
            subLecture,
            duration: lectureDuration.duration,
        });
    }
    catch (error) {
        console.error("Error editing sub-lecture:", error);
        res.status(500).json({
            success: false,
            message: "Failed to edit sub-lecture.",
        });
    }
});
exports.editSubLecture = editSubLecture;
const removeLecture = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { lectureId } = req.params;
        // ✅ Find the parent lecture
        const lecture = yield lectureModel_1.Lecture.findById(lectureId);
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
                    yield (0, cloudinary_1.deleteVideoFromCloudinary)(subLecture.publicId);
                }
            }
        }
        // ✅ Remove the lecture itself
        yield lectureModel_1.Lecture.findByIdAndDelete(lectureId);
        // ✅ Remove the lecture ID from the course
        yield courseModel_1.Course.updateOne({ lectures: lectureId }, { $pull: { lectures: lectureId } });
        res.status(200).json({
            success: true,
            message: "Lecture and sub-lectures removed successfully",
        });
    }
    catch (error) {
        console.error("Error removing lecture:", error);
        res.status(500).json({
            success: false,
            message: "Failed to remove lecture",
        });
    }
});
exports.removeLecture = removeLecture;
const removeSubLecture = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { lectureId, subLectureId } = req.params;
        // Find the parent lecture
        const lecture = yield lectureModel_1.Lecture.findById(lectureId);
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
            yield (0, cloudinary_1.deleteVideoFromCloudinary)(subLecture.publicId);
        }
        // Remove the sub-lecture
        lecture.subLectures.pull(subLectureId);
        yield lecture.save();
        // Calculate updated lecture duration
        const lectureDuration = calculateTotalDuration(lecture.subLectures);
        // Update lecture with new duration info
        yield lectureModel_1.Lecture.findByIdAndUpdate(lectureId, {
            totalMinutes: lectureDuration.totalMinutes,
            totalHours: lectureDuration.totalHours,
            totalDuration: lectureDuration.duration,
        });
        // Update course duration
        yield updateCourseDuration(lectureId);
        res.status(200).json({
            success: true,
            message: "Sub-lecture removed successfully",
        });
    }
    catch (error) {
        console.error("Error removing sub-lecture:", error);
        res.status(500).json({
            success: false,
            message: "Failed to remove sub-lecture",
        });
    }
});
exports.removeSubLecture = removeSubLecture;
const getLectureById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { lectureId } = req.params;
        const lecture = yield lectureModel_1.Lecture.findById(lectureId);
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
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Failed to get lecture by id",
        });
        return;
    }
});
exports.getLectureById = getLectureById;
const togglePublicCourse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { courseId } = req.params;
        const { publish } = req.query;
        const course = yield courseModel_1.Course.findById(courseId);
        if (!course) {
            res.status(404).json({
                success: false,
                message: "Course not found!",
            });
            return;
        }
        if (!course.courseLevel ||
            !["Beginner", "Medium", "Advance"].includes(course.courseLevel)) {
            course.courseLevel = "Beginner"; // Set to default if undefined or invalid
        }
        course.isPublished = publish === "true";
        yield course.save();
        const statusMessage = course.isPublished ? "Published" : "Unpublished";
        res.status(200).json({
            message: `Course is ${statusMessage}`,
        });
        console.log(statusMessage, "statusMessage");
        console.log(course, "course");
        return;
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Failed to update status",
        });
        return;
    }
});
exports.togglePublicCourse = togglePublicCourse;
const getPublishedCourse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const courses = yield courseModel_1.Course.find({ isPublished: true }).populate({
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
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Failed to get published courses",
        });
        return;
    }
});
exports.getPublishedCourse = getPublishedCourse;
const removeCourse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { courseId } = req.params;
        // Find the course first
        const course = yield courseModel_1.Course.findById(courseId);
        if (!course) {
            res.status(404).json({
                success: false,
                message: "Course not found!",
            });
            return;
        }
        // Delete course thumbnail from Cloudinary if exists
        if (course.courseThumbnail) {
            const publicId = (_a = course.courseThumbnail.split("/").pop()) === null || _a === void 0 ? void 0 : _a.split(".")[0];
            if (publicId) {
                yield (0, cloudinary_1.deleteMediaFromCloudinary)(publicId);
            }
        }
        // Delete tutorial video from Cloudinary if exists
        if ((_b = course.tutorial) === null || _b === void 0 ? void 0 : _b.publicId) {
            yield (0, cloudinary_1.deleteMediaFromCloudinary)(course.tutorial.publicId);
        }
        // Find and delete all lectures associated with this course
        const lectures = yield lectureModel_1.Lecture.find({ _id: { $in: course.lectures } });
        for (const lecture of lectures) {
            // Delete videos of all sublectures
            if (lecture.subLectures && lecture.subLectures.length > 0) {
                for (const subLecture of lecture.subLectures) {
                    if (subLecture.publicId) {
                        yield (0, cloudinary_1.deleteVideoFromCloudinary)(subLecture.publicId);
                    }
                }
            }
            // Delete the lecture
            yield lectureModel_1.Lecture.findByIdAndDelete(lecture._id);
        }
        yield reviewModel_1.Review.deleteMany({ course: courseId });
        // Finally, delete the course
        yield courseModel_1.Course.findByIdAndDelete(courseId);
        res.status(200).json({
            success: true,
            message: "Course and all associated content removed successfully",
        });
    }
    catch (error) {
        console.error("Error removing course:", error);
        res.status(500).json({
            success: false,
            message: "Failed to remove course",
        });
    }
});
exports.removeCourse = removeCourse;
