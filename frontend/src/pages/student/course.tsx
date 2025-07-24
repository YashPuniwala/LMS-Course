import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Course as CourseType } from "@/types/types";
import React from "react";
import { Link } from "react-router-dom";
import { Star, Clock, Users, BookOpen } from "lucide-react";

interface CourseProps {
  course: Partial<CourseType>;
}

const Course: React.FC<CourseProps> = ({ course }) => {
  console.log(course, "course")
  return (
    <Link to={`/course-detail/${course._id}`} className="group">
      <Card className="overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-lg border border-gray-100 transition-all duration-300 w-full h-full flex flex-col">
        {/* Course Thumbnail with Badge */}
        <div className="relative w-full h-[180px] overflow-hidden">
          <img
            src={course.courseThumbnail || "/placeholder-course.jpg"}
            alt={course.courseTitle || "Course thumbnail"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Top-right badge */}
          {/* {course.isFeatured && (
            <Badge className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-3 py-1 rounded-full shadow-sm">
              Featured
            </Badge>
          )} */}
        </div>

        <CardContent className="px-5 py-4 flex-1 flex flex-col">
          {/* Course Title */}
          <h3 className="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors mb-3">
            {course.courseTitle || "No Title"}
          </h3>

          {/* Creator Info */}
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
              <AvatarImage
                src={course.creator?.photoUrl}
                alt={course.creator?.name}
              />
              <AvatarFallback className="bg-gray-200 text-gray-600">
                {course.creator?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-600">
              {course.creator?.name || "Unknown Creator"}
            </span>
          </div>

          {/* Course Metadata */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline" className="flex items-center gap-1 text-xs">
              <Star className="h-3 w-3 text-yellow-500" />
              <span>4.8</span>
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1 text-xs">
              <Users className="h-3 w-3 text-blue-500" />
              <span>{course.enrolledStudents?.length || 0} students</span>
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3 text-purple-500" />
              <span>{Math.floor(course.totalHours ?? 10)}h</span>
              </Badge>
          </div>

          {/* Price and Level */}
          <div className="mt-auto flex justify-between items-center">
            <div>
              <Badge className="bg-blue-50 text-blue-600 px-2 py-1 text-xs">
                {course.courseLevel || "All Levels"}
              </Badge>
            </div>
            <div className="text-right">
              {course.coursePrice ? (
                <>
                  <span className="text-lg font-bold text-gray-900">
                    ₹{course.coursePrice.toLocaleString()}
                  </span>
                </>
              ) : (
                <span className="text-lg font-bold text-green-600">Free</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default Course;