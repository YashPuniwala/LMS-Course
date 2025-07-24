import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { useGetAllAdminCoursesQuery } from "@/features/api/courseApi";
import {
  useGetCourseProgressQuery,
  useMarkAsCompletedMutation,
  useMarkAsInCompletedMutation,
  useUpdateLectureProgressMutation,
} from "@/features/api/progressApi";
import { Lecture, SubLecture } from "@/types/types";
import {
  CheckCircle,
  CheckCircle2,
  CirclePlay,
  ChevronDown,
  PlayCircle,
  Video,
  Lock,
  BookOpen,
  AlertCircle,
  Clock,
  Award,
  ChevronRight,
} from "lucide-react";
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const CourseProgress = () => {
  const navigate = useNavigate();
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId || "";
  const videoRef = useRef<HTMLVideoElement>(null);

  const { data, refetch, isLoading } = useGetCourseProgressQuery(courseId, {
    skip: !courseId,
  });

  const { data: courses } = useGetAllAdminCoursesQuery();

  const [updateLectureProgress] = useUpdateLectureProgressMutation();
  const [markAsCompleted] = useMarkAsCompletedMutation();
  const [markAsInCompleted] = useMarkAsInCompletedMutation();

  const [currentLecture, setCurrentLecture] = useState<Lecture | null>(null);
  const [currentSubLecture, setCurrentSubLecture] = useState<SubLecture | null>(
    null
  );
  const [openLectureId, setOpenLectureId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completedVideos, setCompletedVideos] = useState<Set<string>>(
    new Set()
  );
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const formatDuration = (subLecture: SubLecture): string => {
    if (subLecture.duration?.hours > 0) {
      return `${subLecture.duration.hours}h ${subLecture.duration.minutes}m`;
    }
    return `${subLecture.duration.minutes}m`;
  };

  useEffect(() => {
    if (data?.data) {
      setProgressPercentage(data.data.progressPercentage || 0);
      
      const completed = new Set<string>();
      data.data.progress?.forEach((prog) => {
        if (prog.completed) {
          completed.add(prog.lectureId);
        }
        prog.subLectureProgress?.forEach((subProg) => {
          if (subProg.viewed) {
            completed.add(subProg.subLectureId);
          }
        });
      });
      setCompletedVideos(completed);
    }
  }, [data]);

  useEffect(() => {
    if (data?.data?.courseDetails?.lectures?.length && !currentLecture) {
      const firstLecture = data.data.courseDetails.lectures[0];
      setCurrentLecture(firstLecture);
      if (firstLecture?.subLectures?.length) {
        setCurrentSubLecture(firstLecture.subLectures[0]);
      }
      setOpenLectureId(firstLecture._id);
    }
  }, [data, currentLecture]);

  const { courseDetails, progress, completed } = data?.data || {};
  const { courseTitle, lectures } = courseDetails || {};

  const isSubLectureCompleted = (
    lectureId: string,
    subLectureId: string
  ): boolean => {
    if (completedVideos.has(subLectureId)) return true;

    const lectureProgress = progress?.find(
      (prog) => prog.lectureId === lectureId
    );
    return !!lectureProgress?.subLectureProgress?.some(
      (sub) => sub.subLectureId === subLectureId && sub.viewed
    );
  };

  const isLectureCompleted = (lectureId: string): boolean => {
    const lecture = lectures?.find((lec) => lec._id === lectureId);
    if (!lecture) return false;

    return lecture.subLectures.every((sublec) =>
      isSubLectureCompleted(lectureId, sublec._id)
    );
  };

  const isLectureAccessible = (lecture: Lecture): boolean => {
    if (progressPercentage === 100) return true;
    
    const currentIndex = lectures?.findIndex(l => l._id === currentLecture?._id) ?? -1;
    const checkIndex = lectures?.findIndex(l => l._id === lecture._id) ?? -1;
    
    if (currentIndex === -1) return checkIndex === 0;
    
    if (checkIndex <= currentIndex) return true;
    
    if (checkIndex === currentIndex + 1) {
      return isLectureCompleted(currentLecture?._id || "");
    }
    
    return false;
  };

  const isSubLectureAccessible = (lecture: Lecture, subLecture: SubLecture): boolean => {
    if (progressPercentage === 100) return true;
    
    if (!isLectureAccessible(lecture)) return false;
    
    if (lecture._id === currentLecture?._id) {
      const currentSubIndex = currentLecture.subLectures.findIndex(
        sl => sl._id === currentSubLecture?._id
      );
      const checkSubIndex = lecture.subLectures.findIndex(
        sl => sl._id === subLecture._id
      );
      
      if (checkSubIndex <= currentSubIndex) return true;
      
      if (checkSubIndex === currentSubIndex + 1) {
        return isSubLectureCompleted(
          lecture._id,
          currentLecture.subLectures[currentSubIndex]._id
        );
      }
      
      return false;
    }
    
    const currentIndex = lectures?.findIndex(l => l._id === currentLecture?._id) ?? -1;
    const checkIndex = lectures?.findIndex(l => l._id === lecture._id) ?? -1;
    return checkIndex < currentIndex;
  };

  const completedLectures =
    lectures?.reduce((count, lecture) => {
      return isLectureCompleted(lecture._id) ? count + 1 : count;
    }, 0) || 0;

  const totalLectures = lectures?.length || 0;

  const completedSubLectures =
    progress?.reduce((total, prog) => {
      return total + (prog.subLectureProgress?.filter((sub) => sub.viewed).length || 0);
    }, 0) || 0;

  const totalSubLectures =
    lectures?.reduce((total, lecture) => {
      return total + (lecture.subLectures?.length || 0);
    }, 0) || 0;

  const findNextVideo = (): {
    lecture: Lecture;
    subLecture: SubLecture;
  } | null => {
    if (!lectures || !currentLecture || !currentSubLecture) return null;

    const currentLectureIndex = lectures.findIndex(
      (lec) => lec._id === currentLecture._id
    );
    if (currentLectureIndex === -1) return null;

    const currentSubLectureIndex = currentLecture.subLectures.findIndex(
      (sublec) => sublec._id === currentSubLecture._id
    );
    if (currentSubLectureIndex === -1) return null;

    if (currentSubLectureIndex < currentLecture.subLectures.length - 1) {
      return {
        lecture: currentLecture,
        subLecture: currentLecture.subLectures[currentSubLectureIndex + 1],
      };
    }

    if (currentLectureIndex < lectures.length - 1) {
      const nextLecture = lectures[currentLectureIndex + 1];
      if (nextLecture.subLectures.length > 0) {
        return {
          lecture: nextLecture,
          subLecture: nextLecture.subLectures[0],
        };
      }
    }

    return null;
  };

  const handleLectureProgress = async (
    lectureId: string,
    subLectureId?: string,
    markCompleted: boolean = false
  ) => {
    if (!lectureId) return;
    try {
      const response = await updateLectureProgress({
        courseId,
        lectureId,
        subLectureId: subLectureId || "",
        completed: markCompleted,
      }).unwrap();

      if (response.progressPercentage !== undefined) {
        setProgressPercentage(response.progressPercentage);
      }

      if (markCompleted && subLectureId) {
        setCompletedVideos((prev) => new Set([...prev, subLectureId]));
      }
      if (markCompleted && lectureId) {
        setCompletedVideos((prev) => new Set([...prev, lectureId]));
      }

      refetch();
    } catch (error) {
      toast.error("Failed to update progress");
    }
  };

  const handleSelectLecture = (lecture: Lecture) => {
    if (!isLectureAccessible(lecture)) {
      toast.warning("Please complete previous lectures first");
      return;
    }
    
    setCurrentLecture(lecture);
    if (lecture.subLectures?.length) {
      setCurrentSubLecture(lecture.subLectures[0]);
    } else {
      setCurrentSubLecture(null);
    }
    if (lecture._id) {
      handleLectureProgress(lecture._id);
    }
    setIsMobileSidebarOpen(false);
  };

  const handleSelectSubLecture = (lecture: Lecture, subLecture: SubLecture) => {
    if (!isSubLectureAccessible(lecture, subLecture)) {
      toast.warning("Please complete previous lessons first");
      return;
    }
    
    setCurrentLecture(lecture);
    setCurrentSubLecture(subLecture);
    if (lecture._id && subLecture._id) {
      handleLectureProgress(lecture._id, subLecture._id);
    }
    setIsMobileSidebarOpen(false);
  };

  const handleCompleteCourse = async () => {
    try {
      await markAsCompleted({ courseId });
      refetch();
      setProgressPercentage(100);
      toast.success("Course marked as completed!");
    } catch (error) {
      toast.error("Failed to mark course as completed");
    }
  };

  const handleInCompleteCourse = async () => {
    try {
      await markAsInCompleted({ courseId });
      refetch();
      setProgressPercentage(0);
      setCompletedVideos(new Set());
      toast.success("Course marked as incomplete!");
    } catch (error) {
      toast.error("Failed to mark course as incomplete");
    }
  };

  const handleVideoEnded = async () => {
    setIsPlaying(false);

    if (currentLecture?._id && currentSubLecture?._id) {
      await handleLectureProgress(
        currentLecture._id,
        currentSubLecture._id,
        true
      );

      const allSubLecturesCompleted = currentLecture.subLectures.every(
        (sublec) => isSubLectureCompleted(currentLecture._id, sublec._id)
      );

      if (allSubLecturesCompleted) {
        await handleLectureProgress(currentLecture._id, undefined, true);
      }

      const response = await updateLectureProgress({
        courseId,
        lectureId: currentLecture._id,
        subLectureId: currentSubLecture._id,
        completed: true,
      }).unwrap();

      if (response.progressPercentage !== undefined) {
        setProgressPercentage(response.progressPercentage);
      }
    }

    const next = findNextVideo();
    if (next) {
      setCurrentLecture(next.lecture);
      setCurrentSubLecture(next.subLecture);
      setOpenLectureId(next.lecture._id);

      setTimeout(() => {
        if (videoRef.current && next?.subLecture?.videoUrl) {
          videoRef.current.src = next.subLecture.videoUrl;
          videoRef.current.load();
          videoRef.current.play().catch((e) => {
            console.log("Autoplay prevented:", e);
          });
        }
      }, 100);
    } else {
      setProgressPercentage(100);
      toast.success("You've completed all videos in this course!");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 bg-gradient-to-br from-white to-gray-50 shadow-xl rounded-xl space-y-6">
      {/* Mobile Sidebar Toggle Button */}
      <div className="block md:hidden">
        <Button
          variant="outline"
          className="w-full flex items-center justify-between"
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        >
          <span>Course Content</span>
          <ChevronRight
            className={`h-4 w-4 transition-transform ${
              isMobileSidebarOpen ? "rotate-90" : ""
            }`}
          />
        </Button>
      </div>

      {/* Mobile Sidebar */}
      {isMobileSidebarOpen && (
        <div className="block md:hidden">
          <Card className="mb-4">
            <CardContent className="p-0 overflow-y-auto max-h-[400px]">
              {lectures?.map((lecture) => (
                <Collapsible
                  key={lecture._id}
                  open={openLectureId === lecture._id}
                  onOpenChange={() =>
                    isLectureAccessible(lecture) &&
                    setOpenLectureId(
                      openLectureId === lecture._id ? null : lecture._id
                    )
                  }
                  className="mb-2"
                >
                  <CollapsibleTrigger 
                    className={`flex items-center justify-between w-full p-3 transition-colors ${
                      isLectureAccessible(lecture) ? "hover:bg-gray-50" : "opacity-50 cursor-not-allowed"
                    }`}
                    disabled={!isLectureAccessible(lecture)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-gray-100">
                        {currentLecture?._id === lecture._id ? (
                          <PlayCircle size={16} className="text-blue-600" />
                        ) : isLectureCompleted(lecture._id) ? (
                          <CheckCircle2 size={16} className="text-green-500" />
                        ) : isLectureAccessible(lecture) ? (
                          <CirclePlay size={16} className="text-gray-500" />
                        ) : (
                          <Lock size={16} className="text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-left">
                          {lecture.lectureTitle}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronDown
                        className="h-4 w-4 transition-transform duration-200"
                        style={{
                          transform:
                            openLectureId === lecture._id
                              ? "rotate(180deg)"
                              : "rotate(0)",
                        }}
                      />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-10">
                    {lecture.subLectures.map((subLecture) => (
                      <div
                        key={subLecture._id}
                        className={`py-2 px-2 transition-colors ${
                          currentSubLecture?._id === subLecture._id
                            ? "text-blue-600 font-medium"
                            : isSubLectureCompleted(lecture._id, subLecture._id)
                            ? "text-green-600"
                            : "text-gray-600"
                        } ${
                          isSubLectureAccessible(lecture, subLecture)
                            ? "cursor-pointer hover:bg-gray-50"
                            : "opacity-50 cursor-not-allowed"
                        }`}
                        onClick={() => {
                          if (isSubLectureAccessible(lecture, subLecture)) {
                            handleSelectSubLecture(lecture, subLecture);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center h-5 w-5 rounded-full bg-gray-100">
                              {currentSubLecture?._id === subLecture._id &&
                              isPlaying ? (
                                <Video
                                  size={12}
                                  className="text-blue-600 animate-pulse"
                                />
                              ) : isSubLectureCompleted(
                                  lecture._id,
                                  subLecture._id
                                ) ? (
                                <CheckCircle2
                                  size={12}
                                  className="text-green-500"
                                />
                              ) : isSubLectureAccessible(lecture, subLecture) ? (
                                <CirclePlay
                                  size={12}
                                  className="text-gray-500"
                                />
                              ) : (
                                <Lock size={12} className="text-gray-400" />
                              )}
                            </div>
                            <span className="text-sm">
                              {subLecture.subLectureTitle}
                            </span>
                          </div>
                          {subLecture.duration.minutes > 0 && (
                            <span className="text-xs text-gray-500">
                              {formatDuration(subLecture)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 bg-white rounded-xl shadow-md">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{courseTitle}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-600 border-blue-200 text-xs md:text-sm"
            >
              {completedLectures}/{totalLectures} Sections
            </Badge>
            <Badge
              variant="outline"
              className="bg-purple-50 text-purple-600 border-purple-200 text-xs md:text-sm"
            >
              {completedSubLectures}/{totalSubLectures} Lessons
            </Badge>
            <Badge
              variant="outline"
              className="bg-green-50 text-green-600 border-green-200 text-xs md:text-sm"
            >
              {completed ? "Completed" : "In Progress"}
            </Badge>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 w-full md:w-auto">
          <Button
            onClick={completed ? handleInCompleteCourse : handleCompleteCourse}
            variant={completed ? "outline" : "default"}
            className="flex items-center gap-2 w-full md:w-auto"
            size="sm"
          >
            {completed ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Completed</span>
              </>
            ) : (
              <>
                <Award className="h-4 w-4" />
                <span>Mark as completed</span>
              </>
            )}
          </Button>
          <div className="w-full md:w-64">
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-xs md:text-sm text-gray-500 text-right mt-1">
              {progressPercentage}% complete
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Video Player Section */}
        <div className="flex-1 md:w-3/5">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gray-50 p-3 md:p-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg md:text-xl">
                    {currentSubLecture?.subLectureTitle ||
                      currentLecture?.lectureTitle}
                  </CardTitle>
                  <p className="text-xs md:text-sm text-gray-500 mt-1">
                    {isPlaying ? (
                      <span className="flex items-center text-green-600">
                        <CirclePlay className="h-3 w-3 md:h-4 md:w-4 mr-1 animate-pulse" />
                        Currently Playing
                      </span>
                    ) : isSubLectureCompleted(
                        currentLecture?._id || "",
                        currentSubLecture?._id || ""
                      ) ? (
                      <span className="flex items-center text-green-600">
                        <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                        Completed
                      </span>
                    ) : (
                      "Click play to start"
                    )}
                  </p>
                </div>
                <Badge
                  className={`text-xs md:text-sm ${
                    isSubLectureCompleted(
                      currentLecture?._id || "",
                      currentSubLecture?._id || ""
                    )
                      ? "bg-green-100 text-green-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {isSubLectureCompleted(
                    currentLecture?._id || "",
                    currentSubLecture?._id || ""
                  )
                    ? "Watched"
                    : "Unwatched"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {currentSubLecture?.videoUrl ? (
                <video
                  ref={videoRef}
                  src={currentSubLecture.videoUrl}
                  controls
                  className="w-full h-auto aspect-video object-cover"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={handleVideoEnded}
                  key={currentSubLecture?._id}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-64 md:h-[450px] bg-gray-100 text-gray-400">
                  <Video className="h-12 w-12 md:h-16 md:w-16 mb-4 opacity-50" />
                  <p className="text-base md:text-lg">No video available</p>
                  <p className="text-xs md:text-sm mt-2">
                    Select a lecture to start watching
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="mt-4 flex justify-between gap-2">
            <Button
              variant="outline"
              className="flex items-center gap-2 flex-1"
              size="sm"
              onClick={() => {
                const prevVideo = (() => {
                  if (!lectures || !currentLecture || !currentSubLecture)
                    return null;

                  const currentLectureIndex = lectures.findIndex(
                    (lec) => lec._id === currentLecture._id
                  );
                  if (currentLectureIndex === -1) return null;

                  const currentSubLectureIndex =
                    currentLecture.subLectures.findIndex(
                      (sublec) => sublec._id === currentSubLecture._id
                    );
                  if (currentSubLectureIndex === -1) return null;

                  if (currentSubLectureIndex > 0) {
                    return {
                      lecture: currentLecture,
                      subLecture:
                        currentLecture.subLectures[currentSubLectureIndex - 1],
                    };
                  }

                  if (currentLectureIndex > 0) {
                    const prevLecture = lectures[currentLectureIndex - 1];
                    if (prevLecture.subLectures.length > 0) {
                      return {
                        lecture: prevLecture,
                        subLecture:
                          prevLecture.subLectures[
                            prevLecture.subLectures.length - 1
                          ],
                      };
                    }
                  }

                  return null;
                })();

                if (prevVideo) {
                  handleSelectSubLecture(
                    prevVideo.lecture,
                    prevVideo.subLecture
                  );
                }
              }}
              disabled={!findNextVideo}
            >
              <ChevronDown className="h-4 w-4 rotate-90" />
              <span className="hidden sm:inline">Previous</span>
            </Button>

            <Button
              variant="default"
              className="flex items-center gap-2 flex-1"
              size="sm"
              onClick={() => {
                const next = findNextVideo();
                if (next) {
                  handleSelectSubLecture(next.lecture, next.subLecture);
                }
              }}
              disabled={!findNextVideo()}
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronDown className="h-4 w-4 -rotate-90" />
            </Button>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden md:block w-full md:w-2/5">
          <Card className="h-full">
            <CardHeader className="bg-gray-50 p-4">
              <CardTitle className="text-lg md:text-xl flex items-center">
                <BookOpen className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                Course Content
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 overflow-y-auto max-h-[500px]">
              {lectures?.map((lecture) => (
                <Collapsible
                  key={lecture._id}
                  open={openLectureId === lecture._id}
                  onOpenChange={() =>
                    isLectureAccessible(lecture) &&
                    setOpenLectureId(
                      openLectureId === lecture._id ? null : lecture._id
                    )
                  }
                  className="mb-3"
                >
                  <CollapsibleTrigger 
                    className={`flex items-center justify-between w-full p-3 md:p-4 transition-colors border rounded-lg ${
                      isLectureAccessible(lecture) ? "hover:bg-gray-50" : "opacity-50 cursor-not-allowed"
                    }`}
                    disabled={!isLectureAccessible(lecture)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-7 w-7 md:h-8 md:w-8 rounded-full bg-gray-100">
                        {currentLecture?._id === lecture._id ? (
                          <PlayCircle size={16} className="text-blue-600" />
                        ) : isLectureCompleted(lecture._id) ? (
                          <CheckCircle2 size={16} className="text-green-500" />
                        ) : isLectureAccessible(lecture) ? (
                          <CirclePlay size={16} className="text-gray-500" />
                        ) : (
                          <Lock size={16} className="text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm md:text-base text-left">
                          {lecture.lectureTitle}
                        </p>
                        <p className="text-xs text-gray-500">
                          {lecture.subLectures.length} lessons
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isLectureCompleted(lecture._id) && (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-600 border-green-200 text-xs"
                        >
                          Completed
                        </Badge>
                      )}
                      <ChevronDown
                        className="h-4 w-4 transition-transform duration-200"
                        style={{
                          transform:
                            openLectureId === lecture._id
                              ? "rotate(180deg)"
                              : "rotate(0)",
                        }}
                      />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="bg-gray-50 border border-t-0 rounded-b-lg overflow-hidden">
                    {lecture.subLectures.map((subLecture) => (
                      <div
                        key={subLecture._id}
                        className={`py-2 px-3 md:py-3 md:px-4 transition-colors border-l-4 ${
                          currentSubLecture?._id === subLecture._id
                            ? "border-l-blue-500 bg-blue-50"
                            : isSubLectureCompleted(lecture._id, subLecture._id)
                            ? "border-l-green-500 bg-white"
                            : "border-l-transparent bg-white"
                        } ${
                          isSubLectureAccessible(lecture, subLecture)
                            ? "cursor-pointer hover:bg-gray-100"
                            : "opacity-50 cursor-not-allowed"
                        }`}
                        onClick={() => {
                          if (isSubLectureAccessible(lecture, subLecture)) {
                            handleSelectSubLecture(lecture, subLecture);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center h-5 w-5 md:h-6 md:w-6 rounded-full bg-gray-100">
                              {currentSubLecture?._id === subLecture._id &&
                              isPlaying ? (
                                <Video
                                  size={12}
                                  className="text-blue-600 animate-pulse"
                                />
                              ) : isSubLectureCompleted(
                                  lecture._id,
                                  subLecture._id
                                ) ? (
                                <CheckCircle2
                                  size={12}
                                  className="text-green-500"
                                />
                              ) : isSubLectureAccessible(lecture, subLecture) ? (
                                <CirclePlay
                                  size={12}
                                  className="text-gray-500"
                                />
                              ) : (
                                <Lock size={12} className="text-gray-400" />
                              )}
                            </div>
                            <span
                              className={`text-xs md:text-sm ${
                                currentSubLecture?._id === subLecture._id
                                  ? "font-medium"
                                  : ""
                              }`}
                            >
                              {subLecture.subLectureTitle}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {subLecture.duration.minutes > 0 && (
                              <span className="text-xs text-gray-500 flex items-center">
                                <Clock size={10} className="mr-1" />
                                {formatDuration(subLecture)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CourseProgress;