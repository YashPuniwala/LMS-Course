import { ReactNode, useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom"; 
import { useGetCourseDetailWithStatusQuery } from "@/features/api/purchaseApi";

// Define the type for the props
interface PurchaseCourseProtectedRouteProps {
  children: ReactNode;
}

const PurchaseCourseProtectedRoute = ({ children }: PurchaseCourseProtectedRouteProps): JSX.Element => {
  // Extract courseId from URL parameters
  const { courseId } = useParams<{ courseId?: string }>();  // courseId can be undefined

  // State to manage the loading state if courseId is undefined
  const [isCourseIdValid, setIsCourseIdValid] = useState(true);

  // Fetch course details and status, but only if courseId is available
  const { data, isLoading } = useGetCourseDetailWithStatusQuery(courseId || "");

  // If courseId is undefined, set the flag to false to trigger redirection
  useEffect(() => {
    if (!courseId) {
      setIsCourseIdValid(false);
    }
  }, [courseId]);

  // If courseId is not valid, handle it gracefully
  if (!isCourseIdValid) {
    return <Navigate to="/course-detail" />;
  }

  // Show loading state while data is being fetched
  if (isLoading) {
    return <p>Loading...</p>;
  }

  // If the course is purchased, show the children; otherwise, redirect
  return data?.purchased ? (
    <>{children}</>
  ) : (
    <Navigate to={`/course-detail/${courseId}`} />
  );
};

export default PurchaseCourseProtectedRoute;
