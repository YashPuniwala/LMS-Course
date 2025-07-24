import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Course } from "./courseApi";

const USER_API = `${import.meta.env.VITE_BACKEND_URL}/api/v1/`;
// const USER_API = "http://localhost:7000/api/v1"

export interface SubLectureProgressType {
  subLectureId: string;
  viewed: boolean;
}

export interface LectureProgressType {
  lectureId: string;
  completed: boolean;
  subLectureProgress: SubLectureProgressType[]; // ✅ Nested sub-lecture progress
}

export interface CourseProgressType {
  userId: string;
  courseId: string;
  completed: boolean;
  lectureProgress: LectureProgressType[];
}

export interface GetCourseProgressResponse {
  data: {
    courseDetails: Course;
    progress: LectureProgressType[]; // ✅ Nested progress data
    completed: boolean;
    progressPercentage: number; // Added progress percentage
  };
}

export interface UpdateLectureProgressResponse {
  success: boolean;
  message: string;
  progressPercentage: number; // Added progress percentage
}

export interface MarkCourseResponse {
  success: boolean;
  message: string;
}

interface ProgressType {
  lectureId: string;
  completed: boolean;
  subLectureProgress?: {
    subLectureId: string;
    viewed: boolean;
  }[];
}

export interface CourseProgressResponse {
  data: {
    courseDetails: {
      _id: string;
      courseTitle: string;
      lectures: Lecture[];
    };
    progress: ProgressType[];
    completed: boolean;
    progressPercentage: number;
  };
}

export interface Lecture {
  _id: string;
  lectureTitle: string;
  isFree?: boolean;
  subLectures: SubLecture[];
  totalDuration: {
    hours: number;
    minutes: number;
  };
  totalMinutes: number;
  totalHours: number;
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

export const progressApi = createApi({
  reducerPath: "progressApi",
  tagTypes: ["REFETCH_Course_Progress"],
  baseQuery: fetchBaseQuery({
    baseUrl: USER_API,
    credentials: "include",
  }),
  endpoints: (builder) => ({
    // ✅ Get Course Progress with Sub-Lecture Progress
    getCourseProgress: builder.query<GetCourseProgressResponse, string>({
      query: (courseId) => ({
        url: `getCourseProgress/${courseId}`,
        method: "GET",
      }),
      providesTags: [{ type: "REFETCH_Course_Progress" }],
    }),

    // ✅ Update Lecture and Sub-Lecture Progress
    updateLectureProgress: builder.mutation<
  UpdateLectureProgressResponse,
  { courseId: string; lectureId: string; subLectureId: string; completed?: boolean }
>({
  query: ({ courseId, lectureId, subLectureId, completed }) => ({
    url: `update/view/${courseId}/${lectureId}/${subLectureId}`,
    method: "POST",
    body: { completed }, // Add `completed` in the request body
  }),
  invalidatesTags: [{ type: "REFETCH_Course_Progress" }],
}),

    // ✅ Mark Course as Completed
    markAsCompleted: builder.mutation<MarkCourseResponse, { courseId: string }>({
      query: ({ courseId }) => ({
        url: `markAsCompleted/${courseId}`,
        method: "POST",
      }),
      invalidatesTags: [{ type: "REFETCH_Course_Progress" }],
    }),

    // ✅ Mark Course as Incompleted
    markAsInCompleted: builder.mutation<MarkCourseResponse, { courseId: string }>({
      query: ({ courseId }) => ({
        url: `markAsInCompleted/${courseId}`,
        method: "POST",
      }),
      invalidatesTags: [{ type: "REFETCH_Course_Progress" }],
    }),
  }),
});

export const {
  useGetCourseProgressQuery,
  useUpdateLectureProgressMutation,
  useMarkAsCompletedMutation,
  useMarkAsInCompletedMutation,
} = progressApi;