import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  useCreateLectureMutation,
  useCreateSubLectureMutation,
  useGetCourseLectureQuery,
  useRemoveSubLectureMutation,
  useGetLectureByIdQuery,
  useEditSubLectureMutation,
  useEditLectureMutation,
  useRemoveLectureMutation,
} from "@/features/api/courseApi";
import { Loader2, Plus, ChevronDown, Trash2, Pencil, Video, Clock, BookOpen, Search, X, ArrowLeft } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

const CreateLecture = () => {
  const [lectureTitle, setLectureTitle] = useState("");
  const [subLectureTitle, setSubLectureTitle] = useState("");
  const [durationHours, setDurationHours] = useState<number>(0);
  const [durationMinutes, setDurationMinutes] = useState<number>(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [openEditLectureDialog, setOpenEditLectureDialog] = useState(false);
  const [currentLectureId, setCurrentLectureId] = useState<string | null>(null);
  const [currentSubLectureId, setCurrentSubLectureId] = useState<string | null>(null);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [activeAccordionItem, setActiveAccordionItem] = useState<string | null>(null);
  const [highlightedItem, setHighlightedItem] = useState<{lectureId: string | null, subLectureId: string | null}>({
    lectureId: null,
    subLectureId: null
  });
  const [editLectureData, setEditLectureData] = useState({
    lectureTitle: "",
    lectureId: "",
  });

  const params = useParams();
  const navigate = useNavigate();
  const courseId = params.courseId || "";

  const [createLecture, { data, isLoading, isSuccess, error }] = useCreateLectureMutation();
  const [createSubLecture, { isLoading: isSubLectureLoading }] = useCreateSubLectureMutation();
  const [editSubLecture, { isLoading: isUpdateSubLectureLoading }] = useEditSubLectureMutation();
  const [editLecture, { isLoading: isEditLectureLoading }] = useEditLectureMutation();
  const [removeLecture, { isLoading: isRemoveLectureLoading }] = useRemoveLectureMutation();
  const { data: lectureData, isLoading: lectureLoading, refetch } = useGetCourseLectureQuery(courseId);
  const [removeSubLecture, { isLoading: isRemoving }] = useRemoveSubLectureMutation();

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!openDialog) {
      setSubLectureTitle("");
      setDurationHours(0);
      setDurationMinutes(0);
      setVideoFile(null);
      setCurrentVideoUrl(null);
    }
  }, [openDialog]);

  // Filter and highlight search results
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setHighlightedItem({ lectureId: null, subLectureId: null });
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();
    let foundLectureId = null;
    let foundSubLectureId = null;

    // Search through lectures and sub-lectures
    for (const lecture of lectureData?.lectures || []) {
      if (lecture.lectureTitle.toLowerCase().includes(lowerQuery)) {
        foundLectureId = lecture._id;
        setActiveAccordionItem(lecture._id);
        break;
      }

      for (const subLecture of lecture.subLectures) {
        if (subLecture.subLectureTitle.toLowerCase().includes(lowerQuery)) {
          foundLectureId = lecture._id;
          foundSubLectureId = subLecture._id;
          setActiveAccordionItem(lecture._id);
          break;
        }
      }
      if (foundLectureId) break;
    }

    setHighlightedItem({
      lectureId: foundLectureId,
      subLectureId: foundSubLectureId
    });
  }, [searchQuery, lectureData]);

  // Filter lectures based on search query
  const filteredLectures = lectureData?.lectures?.filter(lecture => 
    lecture.lectureTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lecture.subLectures.some(sub => 
      sub.subLectureTitle.toLowerCase().includes(searchQuery.toLowerCase())
    )
  ) || [];

  // Sort lectures
  const sortedLectures = [...filteredLectures].sort((a, b) => {
    return sortOrder === "asc" 
      ? a.lectureTitle.localeCompare(b.lectureTitle)
      : b.lectureTitle.localeCompare(a.lectureTitle);
  });

  // Calculate total course duration
  const totalDuration = lectureData?.lectures?.reduce((total, lecture) => {
    const lectureDuration = lecture.subLectures.reduce((subTotal, subLecture) => {
      return subTotal + (subLecture.duration?.hours || 0) * 60 + (subLecture.duration?.minutes || 0);
    }, 0);
    return total + lectureDuration;
  }, 0) || 0;

  const totalHours = Math.floor(totalDuration / 60);
  const totalMinutes = totalDuration % 60;

  const handleRemoveSubLecture = async (lectureId: string, subLectureId: string) => {
    try {
      await removeSubLecture({ lectureId, subLectureId }).unwrap();
      toast.success("Sub-Lecture deleted successfully!");
      refetch();
    } catch (error) {
      toast.error("Failed to delete sub-lecture");
    }
  };

  const createLectureHandler = async () => {
    if (!lectureTitle) {
      toast.error("Lecture title is required");
      return;
    }
    if (!courseId) {
      toast.error("Course ID is missing");
      return;
    }

    const result = await createLecture({ lectureTitle, courseId });

    if ("data" in result) {
      toast.success("Lecture created successfully!");
      setLectureTitle("");
      refetch();
    }
  };

  const createSubLectureHandler = async () => {
    if (!subLectureTitle || !currentLectureId || !videoFile) {
      toast.error("Title and video are required");
      return;
    }

    const formData = new FormData();
    formData.append("subLectureTitle", subLectureTitle);
    formData.append("hours", durationHours.toString());
    formData.append("minutes", durationMinutes.toString());
    formData.append("videoFile", videoFile);

    try {
      const result = await createSubLecture({
        formData,
        subLectureTitle,
        hours: durationHours,
        minutes: durationMinutes,
        lectureId: currentLectureId,
      });

      if ("data" in result) {
        toast.success("Sub-Lecture created successfully!");
        setOpenDialog(false);
        refetch();
      }
    } catch (error) {
      toast.error("Failed to create sub-lecture.");
    }
  };

  const updateSubLectureHandler = async () => {
    if (!subLectureTitle || !currentLectureId || !currentSubLectureId) {
      toast.error("Title is required");
      return;
    }

    const formData = new FormData();
    formData.append("subLectureTitle", subLectureTitle);
    formData.append("hours", durationHours.toString());
    formData.append("minutes", durationMinutes.toString());

    if (videoFile) {
      formData.append("videoFile", videoFile);
    }

    try {
      const result = await editSubLecture({
        formData,
        lectureId: currentLectureId,
        subLectureId: currentSubLectureId,
        hours: durationHours,
        minutes: durationMinutes,
      });

      if ("data" in result) {
        toast.success("Sub-Lecture updated successfully!");
        setOpenUpdateDialog(false);
        refetch();
      }
    } catch (error) {
      toast.error("Failed to update sub-lecture.");
    }
  };

  const handleOpenSubLectureDialog = (lectureId: string) => {
    setCurrentLectureId(lectureId);
    setOpenDialog(true);
  };

  const handleOpenUpdateSubLectureDialog = (lectureId: string, subLecture: any) => {
    setCurrentLectureId(lectureId);
    setCurrentSubLectureId(subLecture._id);
    setSubLectureTitle(subLecture.subLectureTitle);
    setDurationHours(subLecture.duration?.hours || 0);
    setDurationMinutes(subLecture.duration?.minutes || 0);
    setCurrentVideoUrl(subLecture.videoUrl);
    setVideoFile(null);
    setOpenUpdateDialog(true);
  };

  const handleOpenEditLectureDialog = (lecture: any) => {
    setEditLectureData({
      lectureTitle: lecture.lectureTitle,
      lectureId: lecture._id,
    });
    setOpenEditLectureDialog(true);
  };

  const handleCloseUpdateDialog = () => {
    setOpenUpdateDialog(false);
    setSubLectureTitle("");
    setDurationHours(0);
    setDurationMinutes(0);
    setVideoFile(null);
    setCurrentVideoUrl(null);
    setCurrentSubLectureId(null);
  };

  const handleCloseEditLectureDialog = () => {
    setOpenEditLectureDialog(false);
    setEditLectureData({
      lectureTitle: "",
      lectureId: ""
    });
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setVideoFile(file);
    if (file) {
      setCurrentVideoUrl(URL.createObjectURL(file));
    } else {
      setCurrentVideoUrl(null);
    }
  };

  const updateLectureHandler = async () => {
  if (!editLectureData.lectureTitle || !editLectureData.lectureId || !courseId) {
    toast.error("Lecture title is required");
    return;
  }

  try {
    const formData = new FormData();
    formData.append("lectureTitle", editLectureData.lectureTitle);

    const result = await editLecture({
      formData,
      courseId: courseId,
      lectureId: editLectureData.lectureId,
    });

    if ("data" in result) {
      toast.success("Lecture updated successfully!");
      handleCloseEditLectureDialog();
      refetch();
    }
  } catch (error) {
    toast.error("Failed to update lecture");
  }
};

  const removeLectureHandler = async (lectureId: string) => {
    try {
      await removeLecture({ lectureId }).unwrap();
      setOpenEditLectureDialog(false); // Add this line to close the modal
      toast.success("Lecture deleted successfully!");
      refetch();
    } catch (error) {
      toast.error("Failed to delete lecture");
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setHighlightedItem({ lectureId: null, subLectureId: null });
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success(data?.message || "Lecture created successfully!");
      setLectureTitle("");
    }

    if (error) {
      toast.error("Failed to create lecture");
    }
  }, [isSuccess, error, data]);

  if (lectureLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="flex flex-col items-center p-8 bg-white rounded-xl shadow-lg">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <span className="mt-4 text-lg font-medium text-gray-700">Loading course data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with stats */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="icon"
                className="bg-white/10 hover:bg-white/20 border-white/20 text-white rounded-full"
                onClick={() => navigate(`/admin/courses/${courseId}`)}
              >
                <ArrowLeft size={16} />
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Course Content Manager</h1>
                <p className="opacity-90">Organize and structure your course materials</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <BookOpen className="w-6 h-6 text-blue-200" />
                </div>
                <div>
                  <p className="text-sm opacity-80">Total Lectures</p>
                  <p className="text-xl font-semibold">{lectureData?.lectures?.length || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <Video className="w-6 h-6 text-indigo-200" />
                </div>
                <div>
                  <p className="text-sm opacity-80">Total Sub-Lectures</p>
                  <p className="text-xl font-semibold">
                    {lectureData?.lectures?.reduce((acc, lecture) => acc + lecture.subLectures.length, 0) || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Clock className="w-6 h-6 text-purple-200" />
                </div>
                <div>
                  <p className="text-sm opacity-80">Total Duration</p>
                  <p className="text-xl font-semibold">
                    {totalHours}h {totalMinutes}m
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search lectures or sub-lectures..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-8"
            />
            {searchQuery && (
              <button 
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button
              variant={sortOrder === "asc" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortOrder("asc")}
              className="gap-1"
            >
              <span>A-Z</span>
            </Button>
            <Button
              variant={sortOrder === "desc" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortOrder("desc")}
              className="gap-1"
            >
              <span>Z-A</span>
            </Button>
          </div>
        </div>

        {/* Create Lecture Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-700">
            <Plus className="w-5 h-5" />
            Create New Lecture
          </h2>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-700">Lecture Title</Label>
              <Input
                id="lecture-title-input"
                type="text"
                value={lectureTitle}
                onChange={(e) => setLectureTitle(e.target.value)}
                placeholder="Enter Lecture Title"
                className="mt-1"
              />
            </div>
            <Button
              disabled={isLoading}
              onClick={createLectureHandler}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Lecture"
              )}
            </Button>
          </div>
        </div>

        {/* Lectures List */}
        <div className="space-y-4">
          {sortedLectures.length > 0 ? (
            <Accordion 
              type="single" 
              collapsible 
              className="w-full space-y-3"
              value={activeAccordionItem || undefined}
              onValueChange={setActiveAccordionItem}
            >
              {sortedLectures.map((lecture, index) => (
                <AccordionItem
                  key={lecture._id}
                  value={lecture._id}
                  className={`border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all ${
                    highlightedItem.lectureId === lecture._id ? "ring-2 ring-blue-500" : ""
                  }`}
                >
                  <div className="hover:bg-gray-50 transition-colors">
                    <AccordionTrigger className="px-5 py-4 hover:no-underline">
                      <div className="flex items-center gap-4 flex-1 text-left">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                          highlightedItem.lectureId === lecture._id 
                            ? "bg-blue-600 text-white" 
                            : "bg-blue-100 text-blue-600"
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <h3 className={`font-medium ${
                            highlightedItem.lectureId === lecture._id 
                              ? "text-blue-700" 
                              : "text-gray-900"
                          }`}>
                            {lecture.lectureTitle}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {lecture.subLectures.length} sub-lectures
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditLectureDialog(lecture);
                          }}
                          className="text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenSubLectureDialog(lecture._id);
                          }}
                          className="text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-5 py-3 bg-gray-50">
                      {lecture.subLectures.length > 0 ? (
                        <div className="space-y-3">
                          {lecture.subLectures.map((subLecture, subIndex) => (
                            <div
                              key={subLecture._id}
                              className={`flex items-center justify-between p-3 rounded-lg border ${
                                highlightedItem.subLectureId === subLecture._id
                                  ? "border-blue-500 bg-blue-50"
                                  : "border-gray-200 bg-white"
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                  highlightedItem.subLectureId === subLecture._id
                                    ? "bg-blue-600 text-white"
                                    : "bg-blue-100 text-blue-600"
                                }`}>
                                  {subIndex + 1}
                                </div>
                                <div>
                                  <h4 className={`font-medium ${
                                    highlightedItem.subLectureId === subLecture._id
                                      ? "text-blue-700"
                                      : "text-gray-800"
                                  }`}>
                                    {subLecture.subLectureTitle}
                                  </h4>
                                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                    <Clock className="w-3 h-3" />
                                    <span>
                                      {subLecture.duration?.hours || 0}h {subLecture.duration?.minutes || 0}m
                                    </span>
                                    <Video className="w-3 h-3 ml-2" />
                                    <span>Video</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleOpenUpdateSubLectureDialog(
                                      lecture._id,
                                      subLecture
                                    )
                                  }
                                  className="text-gray-600 hover:text-blue-600"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleRemoveSubLecture(
                                      lecture._id,
                                      subLecture._id
                                    )
                                  }
                                  className="text-gray-600 hover:text-red-600"
                                  disabled={isRemoving}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          No sub-lectures yet. Add your first sub-lecture.
                        </div>
                      )}
                    </AccordionContent>
                  </div>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500">
                {searchQuery ? "No matching lectures found" : "No lectures available yet"}
              </p>
              {!searchQuery && (
                <Button
                  variant="ghost"
                  className="mt-2 text-blue-600"
                  onClick={() => document.getElementById("lecture-title-input")?.focus()}
                >
                  Create your first lecture
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Create Sub-Lecture Dialog */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="max-w-md rounded-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-blue-600">
                <Plus className="w-5 h-5" />
                Add Sub-Lecture
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label className="text-gray-700">Title</Label>
                <Input
                  type="text"
                  placeholder="Sub-Lecture Title"
                  value={subLectureTitle}
                  onChange={(e) => setSubLectureTitle(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-700">Hours</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    min="0"
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-700">Minutes</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    min="0"
                    max="59"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">Video File</Label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Video className="w-8 h-8 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">MP4, WEBM (MAX. 100MB)</p>
                    </div>
                    <input 
                      type="file" 
                      accept="video/*" 
                      className="hidden" 
                      onChange={handleVideoFileChange}
                    />
                  </label>
                </div>
                {currentVideoUrl && (
                  <div className="mt-2">
                    <video src={currentVideoUrl} controls className="w-full rounded-lg border" />
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenDialog(false)}>
                Cancel
              </Button>
              <Button
                disabled={isSubLectureLoading}
                onClick={createSubLectureHandler}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubLectureLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Sub-Lecture"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Update Sub-Lecture Dialog */}
        <Dialog open={openUpdateDialog} onOpenChange={setOpenUpdateDialog}>
          <DialogContent className="max-w-md rounded-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-blue-600">
                <Pencil className="w-5 h-5" />
                Edit Sub-Lecture
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label className="text-gray-700">Title</Label>
                <Input
                  type="text"
                  placeholder="Sub-Lecture Title"
                  value={subLectureTitle}
                  onChange={(e) => setSubLectureTitle(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-700">Hours</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    min="0"
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-700">Minutes</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    min="0"
                    max="59"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>

              {currentVideoUrl && (
                <div className="space-y-2">
                  <Label className="text-gray-700">Current Video</Label>
                  <video src={currentVideoUrl} controls className="w-full rounded-lg border" />
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-gray-700">Replace Video (Optional)</Label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Video className="w-8 h-8 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> a new video
                      </p>
                    </div>
                    <input 
                      type="file" 
                      accept="video/*" 
                      className="hidden" 
                      onChange={handleVideoFileChange}
                    />
                  </label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseUpdateDialog}>
                Cancel
              </Button>
              <Button
                disabled={isUpdateSubLectureLoading}
                onClick={updateSubLectureHandler}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isUpdateSubLectureLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Lecture Dialog */}
        <Dialog open={openEditLectureDialog} onOpenChange={(open) => {
  if (!open) {
    handleCloseEditLectureDialog();
  }
}}>
  <DialogContent className="max-w-md rounded-xl">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2 text-blue-600">
        <Pencil className="w-5 h-5" />
        Edit Lecture
      </DialogTitle>
    </DialogHeader>

    <div className="space-y-4">
      <div>
        <Label className="text-gray-700">Lecture Title</Label>
        <Input
          type="text"
          placeholder="Lecture Title"
          value={editLectureData.lectureTitle}
          onChange={(e) => setEditLectureData({
            ...editLectureData,
            lectureTitle: e.target.value
          })}
          className="mt-1"
        />
      </div>
    </div>

    <DialogFooter className="gap-2">
      <Button
        variant="destructive"
        onClick={() => removeLectureHandler(editLectureData.lectureId)}
        disabled={isRemoveLectureLoading}
        className="mr-auto gap-2"
      >
        {isRemoveLectureLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Deleting...
          </>
        ) : (
          <>
            <Trash2 className="h-4 w-4" />
            Delete Lecture
          </>
        )}
      </Button>
      <Button 
        variant="outline" 
        onClick={handleCloseEditLectureDialog}
        disabled={isRemoveLectureLoading}
      >
        Cancel
      </Button>
      <Button
        disabled={isEditLectureLoading || isRemoveLectureLoading}
        onClick={updateLectureHandler}
        className="bg-blue-600 hover:bg-blue-700 gap-2"
      >
        {isEditLectureLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Updating...
          </>
        ) : (
          <>
            <Pencil className="h-4 w-4" />
            Save Changes
          </>
        )}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
      </div>
    </div>
  );
};

export default CreateLecture;