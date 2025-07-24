import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const USER_API = `${import.meta.env.VITE_BACKEND_URL}/api/v1/`;
// const USER_API = "http://localhost:7000/api/v1"

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

export interface CoursePurchaseType {
    courseId: Course;
    userId: string;
    amount: number;
    status: string;
    paymentId?: string;  // Made optional for free enrollments
    createdAt: Date;
    updatedAt: Date;
}

export interface GetAllPurchasedCoursesResponse {
  purchasedCourse: CoursePurchaseType[];
}

export interface CreateCheckoutSessionResponse {
  success: boolean;
  url?: string;
  message?: string;
  purchase?: CoursePurchaseType;
}

export interface CoursePurchaseDetailResponse {
  course: Course;
  purchased: boolean;
}

export interface EnrollFreeCourseResponse {
  success: boolean;
  message?: string;
  purchase?: CoursePurchaseType;
}

export interface DashboardMetrics {
  data?: {

    totalRevenue: number;
    totalSales: number;
    avgSaleValue: number;
    freeEnrollments: number;
    paidEnrollments: number;
    conversionRate: number;
    monthlyTrend: {
      month: string;
      revenue: number;
      sales: number;
      newStudents: number;
    }[];
    topCourses: {
      courseId: string;
      title: string;
      revenue: number;
      enrollments: number;
      avgDuration: string;
    }[];
    totalStudents: number;
    activeStudents: number;
    categories: {
      category: string;
      count: number;
      revenue: number;
    }[];
    totalCourses: number;
    totalLectures: number;
    totalSubLectures: number;
    avgCourseDuration: string;
  }
}

export const purchaseApi = createApi({
  reducerPath: "purchaseApi",
  tagTypes: ["REFETCH_Course_Purchase"],
  baseQuery: fetchBaseQuery({
    baseUrl: USER_API,
    credentials: "include",
  }),
  endpoints: (builder) => ({
    createCheckoutSession: builder.mutation<
      CreateCheckoutSessionResponse,
      string
    >({
      query: (courseId) => ({
        url: "checkout/create-checkout-session",
        method: "POST",
        body: { courseId },
      }),
    }),

    // New endpoint for free course enrollment
    enrollFreeCourse: builder.mutation<
      EnrollFreeCourseResponse,
      string
    >({
      query: (courseId) => ({
        url: `enroll-free-course/${courseId}`,
        method: "POST",
      }),
      invalidatesTags: ["REFETCH_Course_Purchase"],
    }),

    getCourseDetailWithStatus: builder.query<
      CoursePurchaseDetailResponse,
      string
    >({
      query: (courseId) => ({
        url: `detail-with-status/${courseId}`,
        method: "GET",
      }),
      providesTags: [{ type: "REFETCH_Course_Purchase" }],
    }),

    getAllPurchasedCourses: builder.query<GetAllPurchasedCoursesResponse, void>({
      query: () => ({
        url: "getAllPurchasedCourse",
        method: "GET",
      }),
    }),

    getDashboardMetrics: builder.query<DashboardMetrics, void>({
      query: () => ({
        url: "get-dashboard-metrice",
        method: "GET",
      }),
      providesTags: [{ type: "REFETCH_Course_Purchase" }],
    }),
  }),
});

export const {
  useCreateCheckoutSessionMutation,
  useEnrollFreeCourseMutation, // Export the new hook
  useGetCourseDetailWithStatusQuery,
  useGetAllPurchasedCoursesQuery,
  useGetDashboardMetricsQuery
} = purchaseApi;