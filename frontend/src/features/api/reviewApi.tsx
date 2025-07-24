import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface ReviewType {
    _id: string;
    user: {
      _id: string;
      name: string;
      photoUrl?: string;
    };
    course: string;
    rating: number;
    review?: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface CreateReviewPayload {
    courseId: string;
    rating: number;
    review?: string;
  }
  
  export interface UpdateReviewPayload {
    reviewId: string;
    rating: number;
    review?: string;
  }
  
  export interface ReviewResponse {
    success: boolean;
    message: string;
    review?: ReviewType;
  }
  
  export interface ReviewsListResponse {
    success: boolean;
    count: number;
    total: number;
    page: number;
    pages: number;
    reviews: ReviewType[];
  }
  
  export interface UserReviewResponse {
    success: boolean;
    review: ReviewType | null;
  }

const USER_API = `${import.meta.env.VITE_BACKEND_URL}/api/v1/`;

export const reviewApi = createApi({
  reducerPath: "reviewApi",
  tagTypes: ["REFETCH_Reviews"],
  baseQuery: fetchBaseQuery({
    baseUrl: USER_API,
    credentials: "include",
  }),
  endpoints: (builder) => ({
    createReview: builder.mutation<ReviewResponse, CreateReviewPayload>({
      query: ({ courseId, rating, review }) => ({
        url: `create-review/${courseId}`,
        method: "POST",
        body: { rating, review },
      }),
      invalidatesTags: [{ type: "REFETCH_Reviews" }],
    }),

    updateReview: builder.mutation<ReviewResponse, UpdateReviewPayload>({
      query: ({ reviewId, rating, review }) => ({
        url: `update-review/${reviewId}`,
        method: "PUT",
        body: { rating, review },
      }),
      invalidatesTags: [{ type: "REFETCH_Reviews" }],
    }),

    deleteReview: builder.mutation<ReviewResponse, { reviewId: string }>({
      query: ({ reviewId }) => ({
        url: `delete-review/${reviewId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "REFETCH_Reviews" }],
    }),

    getCourseReviews: builder.query<
      ReviewsListResponse,
      { courseId: string; page?: number; limit?: number }
    >({
      query: ({ courseId, page = 1, limit = 10 }) => ({
        url: `course-reviews/${courseId}`,
        method: "GET",
        params: { page, limit },
      }),
      providesTags: [{ type: "REFETCH_Reviews" }],
    }),

    getUserReviewForCourse: builder.query<
      UserReviewResponse,
      { courseId: string }
    >({
      query: ({ courseId }) => ({
        url: `getUserReviewForCourses/${courseId}`,
        method: "GET",
      }),
      providesTags: [{ type: "REFETCH_Reviews" }],
    }),
  }),
});

export const {
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
  useGetCourseReviewsQuery,
  useGetUserReviewForCourseQuery,
} = reviewApi;