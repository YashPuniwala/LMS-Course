export type Register = {
  name: string;
  email: string;
  password: string;
}

export type Login = {
  email: string;
  password: string;
}


export interface User {
  _id: string;
  name: string;
  email: string;
  role: "instructor" | "student";
  photoUrl?: string;
  enrolledCourses: { _id: string; name: string }[];
}

export interface ProfileData {
  _id: string;
  name: string;
  email: string;
  role: "instructor" | "student";
  photoUrl?: string;
  enrolledCourses: { _id: string; name: string }[];
  message?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
  data: {
    message: string;
  };
}

export interface RegisterBody {
  name: string;
  email: string;
  password: string;
}

export interface AuthError {
  success: false;
  message: string;
}

export type UpdateUserResponse = {
  success: boolean;
  message: string; // Include `message` if the response contains it.
  user?: User;
};

// Course Types

export interface Course {
  _id: string;
  courseTitle: string;
  isFree?: boolean;
  subTitle?: string;
  description?: string;
  category: string;
  courseLevel?: "Beginner" | "Medium" | "Advance";
  coursePrice?: number;
  courseThumbnail?: string;
  enrolledStudents?: string[]; // Assuming user IDs are strings
  lectures?: Lecture[]; // Assuming lecture IDs are strings
  creator?: {
    name?: string;
    email: string;
    role: string;
    photoUrl?: string;
  };
  tutorial?: {
    videoUrl?: string;
    publicId?: string;
    tutorialDescription?: string;
  };
  isPublished: boolean;
  totalMinutes: number;
  totalHours: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CourseType {
  courses: Course[]; // Array of `Course` objects
}

export interface SingleCourseDetail {
  course: {
    _id: string;
    courseTitle: string;
    isFree?: boolean;
    subTitle?: string;
    description?: string;
    category: string;
    courseLevel?: string;
    coursePrice?: number;
    courseThumbnail?: string;
    enrolledStudents?: string[]; // Assuming user IDs are strings
    lectures?: string[]; // Assuming lecture IDs are strings
    creator?: {
      name?: string;
      email: string;
      role: string;
      photoUrl?: string;
    };
    tutorial?: {
      videoUrl?: string;
      publicId?: string;
      tutorialDescription?: string;
    };
     // Updated to include nested creator properties
     isPublished: boolean;
     totalDuration: {
       hours: number;
       minutes: number;
     };
     totalMinutes: number;
     totalHours: number;
     createdAt?: Date;
     updatedAt?: Date;
  }
}

export type UpdateCourseResponse = {
  success: boolean;
  message: string; // Include `message` if the response contains it.
  course?: Course;
};

export type EditCoursePayload = {
  formData: FormData; // The form data to be sent in the request
  courseId: string;
}


export interface SubLecture {
  _id: string;
  subLectureTitle: string;
  videoUrl?: string;
  publicId?: string;
  duration: {
    hours: number;
    minutes: number;
  };
}

export interface Lecture {
  _id: string;
  lectureTitle: string;
  isFree?: boolean;
  subLectures: SubLecture[];
  totalMinutes: number;
  totalHours: number;
}


export interface LectureType {
  lectures?: LectureType
}