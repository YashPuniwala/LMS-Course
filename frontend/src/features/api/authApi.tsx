import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { LoginResponse, ProfileData, RegisterBody, UpdateUserResponse } from "../../types/types";
import { userLoggedIn, userLoggedOut } from "../authSlice";

// const USER_API = "http://localhost:7000/api/v1"
const USER_API = `${import.meta.env.VITE_BACKEND_URL}/api/v1/`;

console.log(USER_API, "VITE_BACKEND_URL");

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: USER_API,
    credentials: "include",
  }),
  endpoints: (builder) => ({
    register: builder.mutation<LoginResponse, RegisterBody>({
      query: (inputData) => ({
        url: "register",
        method: "POST",
        body: inputData,
      }),
    }),

    login: builder.mutation<LoginResponse, { email: string; password: string }>(
      {
        query: (inputData) => ({
          url: "login",
          method: "POST",
          body: inputData,
        }),
        async onQueryStarted(_, { queryFulfilled, dispatch }) {
          try {
            const result = await queryFulfilled;
            dispatch(userLoggedIn({ user: result.data.user }));
          } catch (error) {
            console.log(error);
          }
        },
      }
    ),

    logout: builder.mutation<{ success: boolean; message: string }, void>({
      query: () => ({
        url: "logout",
        method: "POST",
      }),
      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        try {
          await queryFulfilled;
          dispatch(userLoggedOut());
        } catch (error) {
          console.log("Logout Error:", error);
        }
      },
    }),

    loadUser: builder.query<ProfileData, void>({
      query: () => ({
        url: "me",
        method: "GET",
      }),
      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          dispatch(userLoggedIn({ user: result.data }));
          console.log(result, "result")
        } catch (error) {
          console.log(error);
        }
      },
    }),

    updateUser: builder.mutation<UpdateUserResponse, FormData>({
      query: (formData) => ({
        url: "/profile/update",
        method: "PUT",
        body: formData,
      }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useLoadUserQuery,
  useUpdateUserMutation,
} = authApi;
