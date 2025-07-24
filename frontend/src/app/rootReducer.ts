// store.ts
import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "../features/authSlice";
import { authApi } from "@/features/api/authApi";
import { courseApi } from "@/features/api/courseApi";
import { purchaseApi } from "@/features/api/purchaseApi";
import { progressApi } from "@/features/api/progressApi";
import { reviewApi } from "@/features/api/reviewApi";

const rootReducer = combineReducers({
  [authApi.reducerPath]: authApi.reducer,
  [courseApi.reducerPath]: authApi.reducer,
  [purchaseApi.reducerPath]: authApi.reducer,
  [progressApi.reducerPath]: authApi.reducer,
  [reviewApi.reducerPath]: authApi.reducer,
  auth: authReducer,
});

export default rootReducer;

export type RootState = ReturnType<typeof rootReducer>;
