import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/authSlice";
import { authApi } from "@/features/api/authApi";
import { courseApi } from "@/features/api/courseApi";
import { purchaseApi } from "@/features/api/purchaseApi";
import { progressApi } from "@/features/api/progressApi";
import { reviewApi } from "@/features/api/reviewApi";

export const appStore = configureStore({
  reducer: {
    auth: authReducer, // Combine auth reducer with key 'auth'
    [authApi.reducerPath]: authApi.reducer, // Integrate API reducer
    [courseApi.reducerPath]: courseApi.reducer, // Integrate API reducer
    [purchaseApi.reducerPath]: purchaseApi.reducer, // Integrate API reducer
    [progressApi.reducerPath]: progressApi.reducer, // Integrate API reducer
    [reviewApi.reducerPath]: reviewApi.reducer, // Integrate API reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authApi.middleware, courseApi.middleware, purchaseApi.middleware, progressApi.middleware, reviewApi.middleware),
});

const initializeApp = async () => {
  await appStore.dispatch(authApi.endpoints.loadUser.initiate(undefined, { forceRefetch: true }));
}

initializeApp()

// Define RootState and AppDispatch types for type safety
export type RootState = ReturnType<typeof appStore.getState>;
export type AppDispatch = typeof appStore.dispatch;
