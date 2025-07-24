import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BadgeInfo,
  Lock,
  PlayCircle,
  Bookmark,
  Book,
  Users,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Video,
  Loader2,
} from "lucide-react";
import ReactPlayer from "react-player";
import { useNavigate, useParams } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import {
  useEnrollFreeCourseMutation,
  useGetCourseDetailWithStatusQuery,
} from "@/features/api/purchaseApi";
import { Lecture, SubLecture, User } from "@/types/types";
import BuyCourseButton from "@/components/buyCourseButton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { RootState } from "@/app/store";
import { useSelector } from "react-redux";
import RatingAndReviews from "@/components/ratingAndReview";

const CourseDetail: React.FC = () => {
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId || "";
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [expandedLectureId, setExpandedLectureId] = useState<string | null>(
    null
  );
  const [expandedSections, setExpandedSections] = useState({
    tutorial: true,
    content: false,
    description: false,
  });

  const { user } = useSelector((store: RootState) => store.auth) as {
    user: User | null;
  };

  const { data, isLoading, isError, refetch } =
    useGetCourseDetailWithStatusQuery(courseId, { skip: !courseId });

  useEffect(() => {
    if (courseId) {
      refetch();
    }
  }, [user, courseId, refetch]);

  const [enrollFreeCourse, { isLoading: isEnrolling }] =
    useEnrollFreeCourseMutation();

  const handleEnrollCourse = async () => {
    try {
      const result = await enrollFreeCourse(courseId).unwrap();
      if (result.success) {
        toast.success("Successfully enrolled in the course!");
        navigate(`/course-progress/${courseId}`);
      } else {
        toast.error(result.message || "Failed to enroll in course");
      }
    } catch (error) {
      console.error("Enrollment error:", error);
      toast.error("Failed to enroll in course");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold text-red-500">
          Failed to load course details
        </h1>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  const course = data?.course;
  const purchased = data?.purchased;

  const handleContinueCourse = () => {
    if (purchased) {
      navigate(`/course-progress/${courseId}`);
    }
  };

  const handleVideoPlay = () => {
    setIsPlaying(true);
  };

  const handleVideoPause = () => {
    setIsPlaying(false);
  };

  const toggleLecture = (lectureId: string) => {
    setExpandedLectureId(expandedLectureId === lectureId ? null : lectureId);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const formatHoursToHMM = (decimalHours: number | undefined): string => {
    if (decimalHours === undefined) return "0h 0m";
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours % 1) * 60);
    return minutes === 60 ? `${hours + 1}h 0m` : `${hours}h ${minutes}m`;
  };

  const totalLectures =
    course?.lectures?.reduce(
      (total, lecture) => total + (lecture.subLectures?.length || 0),
      0
    ) || 0;

  return (
    <div className="bg-gradient-to-b from-gray-100 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white">
        <div className="max-w-7xl mx-auto py-6 sm:py-12 px-4 md:px-8 flex flex-col gap-2 sm:gap-4">
          <Badge className="w-fit bg-gray-600 hover:bg-gray-700 mb-1 sm:mb-2">
            {course?.category || "Category"}
          </Badge>
          <h1 className="font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-tight">
            {course?.courseTitle || "Course Title"}
          </h1>
          <p className="text-base sm:text-lg md:text-xl opacity-90 max-w-3xl">
            {course?.subTitle || "Course Sub-title"}
          </p>
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-1 sm:mt-2 text-sm sm:text-base">
            <div className="flex items-center gap-1 sm:gap-2">
              <img
                src={
                  course?.creator?.photoUrl || "https://github.com/shadcn.png"
                }
                alt="Creator"
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover"
              />
              <p className="font-medium">
                {course?.creator?.name || "Unknown Creator"}
              </p>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <BadgeInfo size={14} className="sm:w-4 sm:h-4" />
              <p>
                Updated{" "}
                {course?.createdAt
                  ? new Date(course.createdAt).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Users size={14} className="sm:w-4 sm:h-4" />
              <p>{course?.enrolledStudents?.length || 0} enrolled</p>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <GraduationCap size={14} className="sm:w-4 sm:h-4" />
              <p>{course?.courseLevel || "Beginner"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Purchase Card */}
      <div className="block lg:hidden px-4 py-4 mt-4 mb-8">
        {" "}
        {/* Added py-4 for spacing */}
        <Card className="overflow-hidden border-0 shadow-xl">
          <div className="relative">
            <img
              src={course?.courseThumbnail || "/api/placeholder/400/200"}
              alt="Course thumbnail"
              className="w-full aspect-video object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
              <h2 className="text-white font-bold text-lg">
                {course?.courseTitle || "Course Title"}
              </h2>
            </div>
          </div>
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">
                {course?.coursePrice
                  ? `$${course.coursePrice.toFixed(2)}`
                  : "Free"}
              </h1>
              {purchased && (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-600 border-green-200"
                >
                  Purchased
                </Badge>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-center p-4 pt-0">
            {purchased ? (
              <Button
                onClick={handleContinueCourse}
                className="w-full py-4 sm:py-6 text-base sm:text-lg bg-blue-700 hover:bg-blue-800 transition-colors"
              >
                Continue Learning
              </Button>
            ) : course?.isFree ? (
              <Button
                onClick={handleEnrollCourse}
                className="w-full py-4 sm:py-6 text-base sm:text-lg bg-green-600 hover:bg-green-700 transition-colors"
                disabled={isEnrolling}
              >
                {isEnrolling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enrolling...
                  </>
                ) : (
                  "Enroll this Course"
                )}
              </Button>
            ) : (
              <div className="w-full">
                <BuyCourseButton courseId={courseId} />
                <p className="text-center mt-3 text-xs sm:text-sm text-gray-500">
                  30-day money-back guarantee
                </p>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto my-4 sm:my-8 px-4 md:px-8 flex flex-col lg:flex-row gap-6 lg:gap-10">
        {/* Left Side - Course Content */}
        <div className="w-full lg:w-2/3 space-y-6 sm:space-y-8">
          {/* Tutorial Video Section */}
          <Card className="overflow-hidden border-0 shadow-lg">
            <div className="relative w-full aspect-video bg-black">
              <ReactPlayer
                width="100%"
                height="100%"
                url={course?.tutorial?.videoUrl || ""}
                controls={true}
                light={course?.courseThumbnail}
                playIcon={
                  <Button
                    size="lg"
                    variant="default"
                    className="flex items-center gap-2 text-sm sm:text-base"
                  >
                    <PlayCircle size={18} className="sm:w-6 sm:h-6" />
                    <span>Play Free Tutorial</span>
                  </Button>
                }
              />
              <div className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-green-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                Free Tutorial
              </div>
            </div>
          </Card>

          {/* Mobile Collapsible Sections */}
          <div className="lg:hidden space-y-4">
            {/* Tutorial Section */}
            <Collapsible
              open={expandedSections.tutorial}
              onOpenChange={() => toggleSection("tutorial")}
              className="border rounded-lg overflow-hidden"
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <Bookmark className="text-blue-500" />
                  <h2 className="text-lg font-bold">Free Tutorial</h2>
                </div>
                {expandedSections.tutorial ? (
                  <ChevronUp className="text-gray-400" />
                ) : (
                  <ChevronDown className="text-gray-400" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 pt-0">
                <div className="prose prose-blue max-w-none text-sm">
                  {course?.tutorial?.tutorialDescription ? (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: course.tutorial.tutorialDescription,
                      }}
                    />
                  ) : (
                    <p>No tutorial description available.</p>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Course Content Section */}
            <Collapsible
              open={expandedSections.content}
              onOpenChange={() => toggleSection("content")}
              className="border rounded-lg overflow-hidden"
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <Book />
                  <h2 className="text-lg font-bold">Course Content</h2>
                </div>
                {expandedSections.content ? (
                  <ChevronUp className="text-gray-400" />
                ) : (
                  <ChevronDown className="text-gray-400" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="p-0">
                <CardContent className="space-y-3">
                  {course?.lectures?.length ? (
                    course.lectures.map((lecture: Lecture) => (
                      <Collapsible
                        key={lecture._id}
                        open={expandedLectureId === lecture._id}
                        onOpenChange={() => toggleLecture(lecture._id)}
                        className="border rounded-lg overflow-hidden mb-3"
                      >
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              {purchased ? (
                                <div className="bg-green-100 p-2 rounded-full">
                                  <PlayCircle
                                    size={16}
                                    className="text-green-600"
                                  />
                                </div>
                              ) : (
                                <div className="bg-gray-100 p-2 rounded-full">
                                  <Lock size={16} className="text-gray-600" />
                                </div>
                              )}
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-sm">
                                {lecture.lectureTitle}
                              </p>
                              <p className="text-xs text-gray-500">
                                {lecture.subLectures?.length || 0} lectures •{" "}
                                {formatHoursToHMM(lecture.totalHours)}
                              </p>
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-gray-400">
                            {expandedLectureId === lecture._id ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="bg-gray-100 border-t">
                          <div className="p-2">
                            {lecture.subLectures?.map(
                              (subLecture: SubLecture) => (
                                <div
                                  key={subLecture._id}
                                  className="flex items-center gap-3 p-2 hover:bg-gray-100 transition-colors rounded-md text-sm"
                                >
                                  <div className="flex-shrink-0">
                                    {purchased ? (
                                      <Video
                                        size={16}
                                        className="text-green-600"
                                      />
                                    ) : (
                                      <Lock
                                        size={16}
                                        className="text-gray-600"
                                      />
                                    )}
                                  </div>
                                  <div className="flex-grow">
                                    <p>{subLecture.subLectureTitle}</p>
                                  </div>
                                  <div className="flex-shrink-0 text-gray-500">
                                    {subLecture.duration.hours > 0 &&
                                      `${subLecture.duration.hours}h `}
                                    {subLecture.duration.minutes > 0
                                      ? `${subLecture.duration.minutes}m`
                                      : "0m"}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))
                  ) : (
                    <div className="text-center py-4 text-sm">
                      No lectures available for this course.
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>

            {/* Description Section */}
            <Collapsible
              open={expandedSections.description}
              onOpenChange={() => toggleSection("description")}
              className="border rounded-lg overflow-hidden"
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-gray-50 transition-colors">
                <h2 className="text-lg font-bold">About This Course</h2>
                {expandedSections.description ? (
                  <ChevronUp className="text-gray-400" />
                ) : (
                  <ChevronDown className="text-gray-400" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 pt-0">
                <div className="prose prose-blue max-w-none text-sm">
                  {course?.description ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: course.description }}
                    />
                  ) : (
                    <p>No description available.</p>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Desktop Tabs */}
          <div className="hidden lg:block">
            <Tabs defaultValue="tutorial" className="w-full">
              <TabsList className="grid grid-cols-3 mb-6 sm:mb-8">
                <TabsTrigger value="tutorial" className="text-xs sm:text-base">
                  Tutorial
                </TabsTrigger>
                <TabsTrigger value="lectures" className="text-xs sm:text-base">
                  Course Content
                </TabsTrigger>
                <TabsTrigger
                  value="description"
                  className="text-xs sm:text-base"
                >
                  Description
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tutorial" className="space-y-4 sm:space-y-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Bookmark className="text-blue-500" size={20} />
                    <h2 className="text-xl sm:text-2xl font-bold">
                      Free Tutorial
                    </h2>
                  </div>
                  <div className="prose prose-blue max-w-none text-sm sm:text-base">
                    {course?.tutorial?.tutorialDescription ? (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: course.tutorial.tutorialDescription,
                        }}
                      />
                    ) : (
                      <p>No tutorial description available.</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="lectures" className="space-y-4 sm:space-y-6">
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl">
                      <Book size={18} className="sm:w-5 sm:h-5" />
                      Course Content
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      <span className="font-medium">
                        {course?.lectures?.length || 0} sections •{" "}
                      </span>
                      <span className="font-medium">
                        {totalLectures} lectures •{" "}
                      </span>
                      <span className="font-medium">
                        {formatHoursToHMM(course?.totalHours ?? 10)}
                        &nbsp;total length
                      </span>{" "}
                      •{" "}
                      <span className="font-medium">
                        {purchased ? "Full Access" : "Locked"}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-3 sm:space-y-4">
                    {course?.lectures?.length ? (
                      course.lectures.map((lecture: Lecture) => (
                        <Collapsible
                          key={lecture._id}
                          open={expandedLectureId === lecture._id}
                          onOpenChange={() => toggleLecture(lecture._id)}
                          className="border rounded-lg overflow-hidden"
                        >
                          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="flex-shrink-0">
                                {purchased ? (
                                  <div className="bg-green-100 p-1 sm:p-2 rounded-full">
                                    <PlayCircle
                                      size={16}
                                      className="text-green-600 sm:w-4 sm:h-4"
                                    />
                                  </div>
                                ) : (
                                  <div className="bg-gray-100 p-1 sm:p-2 rounded-full">
                                    <Lock
                                      size={16}
                                      className="text-gray-600 sm:w-4 sm:h-4"
                                    />
                                  </div>
                                )}
                              </div>
                              <div className="text-left">
                                <p className="font-medium text-sm sm:text-base">
                                  {lecture.lectureTitle}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-500">
                                  {lecture.subLectures?.length || 0} lectures •{" "}
                                  {formatHoursToHMM(lecture.totalHours)}
                                </p>
                              </div>
                            </div>
                            <div className="flex-shrink-0 text-gray-400">
                              {expandedLectureId === lecture._id ? (
                                <ChevronUp
                                  size={16}
                                  className="sm:w-4 sm:h-4"
                                />
                              ) : (
                                <ChevronDown
                                  size={16}
                                  className="sm:w-4 sm:h-4"
                                />
                              )}
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="bg-gray-100 border-t">
                            <div className="p-2">
                              {lecture.subLectures?.map(
                                (subLecture: SubLecture) => (
                                  <div
                                    key={subLecture._id}
                                    className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 hover:bg-gray-100 transition-colors rounded-md text-sm"
                                  >
                                    <div className="flex-shrink-0">
                                      {purchased ? (
                                        <Video
                                          size={16}
                                          className="text-green-600 sm:w-4 sm:h-4"
                                        />
                                      ) : (
                                        <Lock
                                          size={16}
                                          className="text-gray-600 sm:w-4 sm:h-4"
                                        />
                                      )}
                                    </div>
                                    <div className="flex-grow">
                                      <p>{subLecture.subLectureTitle}</p>
                                    </div>
                                    <div className="flex-shrink-0 text-gray-500">
                                      {subLecture.duration.hours > 0 &&
                                        `${subLecture.duration.hours}h `}
                                      {subLecture.duration.minutes > 0
                                        ? `${subLecture.duration.minutes}m`
                                        : "0m"}
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))
                    ) : (
                      <div className="text-center py-4 text-sm">
                        No lectures available for this course.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent
                value="description"
                className="space-y-4 sm:space-y-6"
              >
                <div className="prose prose-blue max-w-none text-sm sm:text-base">
                  <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
                    About This Course
                  </h2>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: course?.description || "",
                    }}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Right Side - Purchase Card - Hidden on mobile */}
        <div className="hidden lg:block w-full lg:w-1/3 lg:sticky lg:top-8 self-start">
          <Card className="overflow-hidden border-0 shadow-xl">
            <div className="relative">
              <img
                src={course?.courseThumbnail || "/api/placeholder/400/200"}
                alt="Course thumbnail"
                className="w-full aspect-video object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                <h2 className="text-white font-bold text-lg">
                  {course?.courseTitle || "Course Title"}
                </h2>
              </div>
            </div>
            <CardContent className="p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">
                  {course?.coursePrice
                    ? `$${course.coursePrice.toFixed(2)}`
                    : "Free"}
                </h1>
                {purchased && (
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-600 border-green-200"
                  >
                    Purchased
                  </Badge>
                )}
              </div>

              <div className="space-y-4 mt-4">
                <h3 className="font-semibold">This course includes:</h3>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <PlayCircle size={20} className="text-blue-500" />
                    <span>Full lifetime access</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Book size={20} className="text-blue-500" />
                    <span>{course?.lectures?.length || 0} lectures</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <GraduationCap size={20} className="text-blue-500" />
                    <span>{course?.courseLevel || "Beginner"} level</span>
                  </li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center p-6 pt-0">
              {purchased ? (
                <Button
                  onClick={handleContinueCourse}
                  className="w-full py-6 text-lg bg-blue-700 hover:bg-blue-800 transition-colors"
                >
                  Continue Learning
                </Button>
              ) : course?.isFree ? (
                <Button
                  onClick={handleEnrollCourse}
                  className="w-full py-6 text-lg bg-green-600 hover:bg-green-700 transition-colors"
                  disabled={isEnrolling}
                >
                  {isEnrolling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enrolling...
                    </>
                  ) : (
                    "Enroll this Course"
                  )}
                </Button>
              ) : (
                <div className="w-full">
                  <BuyCourseButton courseId={courseId} />
                  <p className="text-center mt-4 text-sm text-gray-500">
                    30-day money-back guarantee
                  </p>
                </div>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Mobile Bottom Course Details */}
      <div className="block lg:hidden px-4 mb-6">
        <Card className="overflow-hidden border-0 shadow-xl">
          <CardContent className="p-4 flex flex-col gap-3">
            <h3 className="font-semibold text-sm">This course includes:</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <PlayCircle size={16} className="text-blue-500" />
                <span className="text-sm">Full lifetime access</span>
              </li>
              <li className="flex items-center gap-2">
                <Book size={16} className="text-blue-500" />
                <span className="text-sm">
                  {course?.lectures?.length || 0} lectures
                </span>
              </li>
              <li className="flex items-center gap-2">
                <GraduationCap size={16} className="text-blue-500" />
                <span className="text-sm">
                  {course?.courseLevel || "Beginner"} level
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
      <RatingAndReviews courseId={courseId} />

    </div>
  );
};

export default CourseDetail;
