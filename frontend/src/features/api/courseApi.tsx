import {
  CourseType,
  EditCoursePayload,
  SingleCourseDetail,
  UpdateCourseResponse,
} from "@/types/types";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const USER_API = `${import.meta.env.VITE_BACKEND_URL}/api/v1/`;
// const USER_API = "http://localhost:7000/api/v1";

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
  enrolledStudents?: string[];
  lectures?: Lecture[];
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

export interface PublishedCoursesResponse {
  courses: Course[];
}

interface CreateLectureResponse {
  success: boolean;
  message: string;
  lecture: Lecture;
}

export interface CreateSubLectureResponse {
  success: boolean;
  message: string;
  subLecture: SubLecture;
  duration: {
    hours: number;
    minutes: number;
  };
}

export interface UpdateSubLectureResponse {
  success: boolean;
  message: string;
  subLecture: SubLecture;
  duration: {
    hours: number;
    minutes: number;
  };
}

interface UpdateLectureResponse {
  success: boolean;
  message: string;
  lecture: Lecture;
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
  totalDuration: {
    hours: number;
    minutes: number;
  };
  totalMinutes: number;
  totalHours: number;
}

export interface SubLectureResponse {
  subLectures: SubLecture[];
}
export interface LectureResponse {
  lectures: Lecture[];
}

export interface RemoveSubLectureResponse {
  success: boolean;
  message: string;
}
export interface RemoveLectureResponse {
  success: boolean;
  message: string;
}

export interface RemoveCourseResponse {
  success: boolean;
  message: string;
}

export interface LectureDetailResponse {
  success: boolean;
  lecture: Lecture;
}

export interface SubLectureDetailResponse {
  success: boolean;
  subLecture: SubLecture;
}

export const courseApi = createApi({
  reducerPath: "courseApi",
  tagTypes: ["REFETCH_Creator_Course"],
  baseQuery: fetchBaseQuery({
    baseUrl: USER_API,
    credentials: "include",
  }),
  endpoints: (builder) => ({
    createCourse: builder.mutation({
      query: ({
        courseTitle,
        isFree,
        category,
      }: {
        courseTitle: string;
        isFree: boolean;
        category: string;
      }) => ({
        url: "create-course",
        method: "POST",
        body: { courseTitle, category, isFree },
      }),
      invalidatesTags: [{ type: "REFETCH_Creator_Course" }],
    }),

    searchCourse: builder.query<
      PublishedCoursesResponse,
      { query: string; sortBy: string; categories: string }
    >({
      query: ({ query = "", sortBy = "createdAt", categories = "" }) => ({
        url: "search",
        method: "GET",
        params: { query, sortBy: sortBy || "createdAt", categories },
      }),
      providesTags: [{ type: "REFETCH_Creator_Course" }],
    }),

    getAllAdminCourses: builder.query<CourseType, void>({
      query: () => ({
        url: "courses",
        method: "GET",
      }),
      providesTags: [{ type: "REFETCH_Creator_Course" }],
    }),

    editCourse: builder.mutation<UpdateCourseResponse, EditCoursePayload>({
      query: ({ formData, courseId }) => ({
        url: `courses/${courseId}`,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: [{ type: "REFETCH_Creator_Course" }],
    }),

    getCourseById: builder.query<SingleCourseDetail, string>({
      query: (courseId) => ({
        url: `getCourseById/${courseId}`,
        method: "GET",
      }),
      providesTags: [{ type: "REFETCH_Creator_Course" }],
    }),

    createLecture: builder.mutation<
      CreateLectureResponse,
      { lectureTitle: string; courseId: string }
    >({
      query: ({ lectureTitle, courseId }) => ({
        url: `create-lecture/${courseId}`,
        method: "POST",
        body: { lectureTitle },
      }),
      invalidatesTags: [{ type: "REFETCH_Creator_Course" }],
    }),

    createSubLecture: builder.mutation<
      CreateSubLectureResponse,
      {
        formData: FormData;
        subLectureTitle: string;
        hours: number;
        minutes: number;
        lectureId: string;
      }
    >({
      query: ({ formData, lectureId, hours, minutes }) => ({
        url: `create-subLecture/${lectureId}`,
        method: "POST",
        body: formData,
        params: { hours, minutes }, // or include in formData
      }),
      invalidatesTags: [{ type: "REFETCH_Creator_Course" }],
    }),

    getCourseLecture: builder.query<LectureResponse, string>({
      query: (courseId) => ({
        url: `getCourseLecture/${courseId}`,
        method: "GET",
      }),
      providesTags: [{ type: "REFETCH_Creator_Course" }],
    }),

    getSingleLectureSubLectures: builder.query<
      SubLectureDetailResponse,
      { lectureId: string }
    >({
      query: ({ lectureId }) => ({
        url: `getSubLectures/${lectureId}`,
        method: "GET",
      }),
      providesTags: [{ type: "REFETCH_Creator_Course" }],
    }),

    getSubLectures: builder.query<SubLectureResponse, string>({
      query: (lectureId) => ({
        url: `getSubLectures/${lectureId}`,
        method: "GET",
      }),
      providesTags: [{ type: "REFETCH_Creator_Course" }],
    }),

    editLecture: builder.mutation<
      UpdateLectureResponse,
      { formData: FormData; courseId: string; lectureId: string }
    >({
      query: ({ formData, courseId, lectureId }) => ({
        url: `lectures/${courseId}/${lectureId}`,
        method: "PUT",
        body: formData, // Send FormData
      }),
      invalidatesTags: [{ type: "REFETCH_Creator_Course" }],
    }),

    editSubLecture: builder.mutation<
      UpdateSubLectureResponse,
      {
        formData: FormData;
        lectureId: string;
        subLectureId: string;
        hours?: number;
        minutes?: number;
        subLectureTitle?: string;
      }
    >({
      query: ({ formData, lectureId, subLectureId, hours, minutes }) => ({
        url: `subLectures/${lectureId}/${subLectureId}`,
        method: "PUT",
        body: formData,
        params: { hours, minutes }, // or include in formData
      }),
      invalidatesTags: [{ type: "REFETCH_Creator_Course" }],
    }),

    removeCourse: builder.mutation<RemoveCourseResponse, { courseId: string }>({
      query: ({ courseId }) => ({
        url: `remove-course/${courseId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "REFETCH_Creator_Course" }],
    }),

    removeLecture: builder.mutation<
      RemoveLectureResponse,
      { lectureId: string }
    >({
      query: ({ lectureId }) => ({
        url: `remove-lecture/${lectureId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "REFETCH_Creator_Course" }],
    }),

    removeSubLecture: builder.mutation<
      RemoveSubLectureResponse,
      { lectureId: string; subLectureId: string }
    >({
      query: ({ lectureId, subLectureId }) => ({
        url: `remove-subLecture/${lectureId}/${subLectureId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "REFETCH_Creator_Course" }],
    }),

    getLectureById: builder.query<LectureDetailResponse, { lectureId: string }>(
      {
        query: ({ lectureId }) => ({
          url: `getLectureById/${lectureId}`,
          method: "GET",
        }),
        providesTags: [{ type: "REFETCH_Creator_Course" }],
      }
    ),

    publishCourse: builder.mutation<
      { success: boolean; message: string },
      { courseId: string; query: boolean }
    >({
      query: ({ courseId, query }) => ({
        url: `publish-course/${courseId}?publish=${query}`,
        method: "PATCH",
        body: query,
      }),
      invalidatesTags: [{ type: "REFETCH_Creator_Course" }],
    }),

    getPublishedCourse: builder.query<CourseType, void>({
      query: () => ({
        url: `getPublishedCourse`,
        method: "GET",
      }),
      providesTags: [{ type: "REFETCH_Creator_Course" }],
    }),
  }),
});

export const {
  useCreateCourseMutation,
  useSearchCourseQuery,
  useGetAllAdminCoursesQuery,
  useEditCourseMutation,
  useGetCourseByIdQuery,
  useCreateLectureMutation,
  useCreateSubLectureMutation,
  useGetCourseLectureQuery,
  useGetSubLecturesQuery,
  useGetSingleLectureSubLecturesQuery,
  useEditLectureMutation,
  useEditSubLectureMutation,
  useRemoveCourseMutation,
  useRemoveLectureMutation,
  useRemoveSubLectureMutation,
  useGetLectureByIdQuery,
  usePublishCourseMutation,
  useGetPublishedCourseQuery,
} = courseApi;
