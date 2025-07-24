import { Skeleton } from "@/components/ui/skeleton";
import React from "react";
import Course from "./course";
import { useGetPublishedCourseQuery } from "@/features/api/courseApi";
import { Sparkles, Award, Clock, BarChart2 } from "lucide-react";

const Courses = () => {
  const { data, isLoading, isError } = useGetPublishedCourseQuery();

  if (isLoading) return <CourseGridSkeleton />;
  if (isError) return <ErrorComponent />;

  const courses = data?.courses ?? [];

  return (
    <div className="bg-gradient-to-b from-[#F9FAFB] to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
            Unlock Your <span className="text-yellow-300">Potential</span>
          </h1>
          <p className="text-lg sm:text-xl max-w-3xl mx-auto mb-6 sm:mb-8 px-2 sm:px-0">
            Discover courses that will transform your skills and accelerate your career
          </p>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mt-8 sm:mt-12">
            <FeatureBadge icon={<Award className="h-4 w-4 sm:h-5 sm:w-5" />} text="Certified Courses" />
            <FeatureBadge icon={<Clock className="h-4 w-4 sm:h-5 sm:w-5" />} text="Self-Paced Learning" />
            <FeatureBadge icon={<BarChart2 className="h-4 w-4 sm:h-5 sm:w-5" />} text="Career Growth" />
          </div>
        </div>
      </div>

      {/* Courses Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 md:mb-12">
          <div className="text-center md:text-left mb-4 md:mb-0">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
              Explore Our Courses
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              Handpicked by experts to boost your skills
            </p>
          </div>
          <div className="relative">
            <Sparkles className="hidden sm:block absolute -left-8 -top-3 text-yellow-400 h-6 w-6" />
            <span className="bg-blue-100 text-blue-800 px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium">
              {courses.length}+ Courses Available
            </span>
          </div>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
          {courses.length === 0 ? (
            <CourseGridSkeleton />
          ) : (
            courses.map((course) => (
              <Course key={course._id} course={course} />
            ))
          )}
        </div>

        {/* CTA Section */}
        {courses.length > 0 && (
          <div className="mt-12 sm:mt-16 text-center bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
              Can't find what you're looking for?
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 max-w-2xl mx-auto">
              We're constantly adding new courses. Let us know what you'd like to learn!
            </p>
            <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 sm:px-8 sm:py-3 rounded-lg font-medium hover:shadow-md transition-all duration-300 text-sm sm:text-base">
              Request a Course
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Feature Badge Component
const FeatureBadge = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <div className="flex items-center gap-1 sm:gap-2 bg-white/10 backdrop-blur-sm px-3 py-1 sm:px-4 sm:py-2 rounded-full text-sm sm:text-base">
    <span className="text-yellow-300">{icon}</span>
    <span>{text}</span>
  </div>
);

// Error Component
const ErrorComponent = () => (
  <div className="max-w-7xl mx-auto p-4 sm:p-8 text-center">
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 sm:p-8 max-w-2xl mx-auto">
      <h2 className="text-xl sm:text-2xl font-bold text-red-600 mb-3 sm:mb-4">Oops! Something went wrong</h2>
      <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
        We're having trouble loading the courses. Please try refreshing the page or check back later.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="bg-red-600 text-white px-4 py-2 sm:px-6 sm:py-2 rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
      >
        Refresh Page
      </button>
    </div>
  </div>
);

// Skeleton Loader for Grid
const CourseGridSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
      {Array.from({ length: 4 }).map((_, index) => (
        <CourseSkeleton key={index} />
      ))}
    </div>
  </div>
);

// Individual Course Skeleton
const CourseSkeleton = () => {
  return (
    <div className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200 rounded-xl overflow-hidden group">
      <div className="relative overflow-hidden">
        <Skeleton className="w-full h-32 sm:h-40 bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse" />
        <div className="absolute bottom-2 right-2">
          <Skeleton className="h-5 sm:h-6 w-12 sm:w-16 bg-gray-300 rounded-full" />
        </div>
      </div>
      <div className="px-4 sm:px-6 py-3 sm:py-5 space-y-3 sm:space-y-4">
        <Skeleton className="h-5 sm:h-6 w-3/4 bg-gray-200 rounded-md" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Skeleton className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-gray-200" />
            <Skeleton className="h-4 w-16 sm:h-5 sm:w-24 bg-gray-200 rounded-md" />
          </div>
          <div className="flex items-center">
            <Skeleton className="h-3 w-3 sm:h-4 sm:w-4 bg-gray-200 rounded-full mr-1" />
            <Skeleton className="h-3 w-6 sm:h-4 sm:w-8 bg-gray-200 rounded-md" />
          </div>
        </div>
        <div className="flex justify-between items-center">
          <Skeleton className="h-3 w-12 sm:h-4 sm:w-16 bg-gray-200 rounded-md" />
          <Skeleton className="h-8 w-20 sm:h-10 sm:w-24 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export default Courses;