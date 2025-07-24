import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  useEditLectureMutation,
  useGetLectureByIdQuery,
  useRemoveLectureMutation,
} from "@/features/api/courseApi";
import { Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

const LectureTab: React.FC = () => {
  const [input, setInput] = useState<{
    lectureTitle: string;
    isFree: boolean;
    videoFile: File | null;
  }>({
    lectureTitle: "",
    isFree: false,
    videoFile: null,
  });

  const params = useParams();
  const courseId = params.courseId || "";
  const lectureId = params.lectureId || "";
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [editLecture, { isLoading: isMutationLoading, isSuccess, error }] =
    useEditLectureMutation();
  const [
    removeLecture,
    { data: removeData, isLoading: removeLoading, isSuccess: removeSuccess },
  ] = useRemoveLectureMutation();
  const {
    data: lectureData,
    isLoading: lectureIsLoading,
    isSuccess: lectureIsSuccess,
  } = useGetLectureByIdQuery({ lectureId }, { skip: !lectureId });

  const navigate = useNavigate();

  useEffect(() => {
    if (lectureIsSuccess && lectureData?.lecture) {
      const lecture = lectureData.lecture;
      setInput({
        lectureTitle: lecture.lectureTitle || "",
        isFree: lecture.isFree || false,
        videoFile: null,
      });
    }
  }, [lectureIsSuccess, lectureData]);

  const changeEventHandler = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;

    setInput({ ...input, [name]: type === "checkbox" ? checked : value });
  };

  const selectVideoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInput({ ...input, videoFile: file });
      const videoURL = URL.createObjectURL(file);
      setPreviewVideo(videoURL);
    }
  };

  useEffect(() => {
    if (isSuccess || error) {
      toast[isSuccess ? "success" : "error"](
        isSuccess ? "Lecture updated successfully" : "Failed to update lecture"
      );
      if (isSuccess) navigate(`/admin/courses/${courseId}`);
    }
  }, [isSuccess, error, navigate, courseId]);

  const updateLectureHandler = async () => {
    if (!lectureId || !courseId) return;

    const formData = new FormData();
    formData.append("lectureTitle", input.lectureTitle);
    formData.append("isFree", input.isFree.toString());

    setIsUploading(true);

    await editLecture({
      formData,
      courseId,
      lectureId,
    });

    setIsUploading(false);
  };

  const removeLectureHandler = async () => {
    await removeLecture({ lectureId });
  };

  useEffect(() => {
    if (removeSuccess) {
      toast.success(removeData.message);
      navigate(`/admin/courses/${courseId}`);
    }
  }, [removeSuccess]);

  if (lectureIsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="mt-2">Loading lecture data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-0 py-4 sm:px-6 md:px-8">
      <Card className="w-full">
        <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4 sm:p-6">
          <div className="space-y-1">
            <CardTitle className="text-lg sm:text-xl">Edit Lecture</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Make changes and click save when done.
            </CardDescription>
          </div>
          <div className="flex justify-end mt-2 sm:mt-0">
            <Button
              disabled={removeLoading}
              variant="destructive"
              onClick={removeLectureHandler}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              {removeLoading ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  Please wait
                </>
              ) : (
                "Remove Lecture"
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            <div>
              <Label className="text-xs sm:text-sm">Title</Label>
              <Input
                type="text"
                name="lectureTitle"
                value={input.lectureTitle}
                onChange={changeEventHandler}
                placeholder="Ex. Introduction to Javascript"
                className="w-full text-xs sm:text-sm"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={input.isFree}
                onCheckedChange={(value) =>
                  setInput({ ...input, isFree: value })
                }
                id="is-free"
                className="scale-90 sm:scale-100"
              />
              <Label htmlFor="is-free" className="text-xs sm:text-sm">
                Is this video FREE
              </Label>
            </div>

            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Video File</Label>
              <Input
                type="file"
                accept="video/*"
                onChange={selectVideoFile}
                className="w-full text-xs"
              />
              {previewVideo && (
                <div className="mt-2">
                  <video
                    src={previewVideo}
                    controls
                    className="w-full max-h-48 sm:max-h-64 rounded-md"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
              <Button
                disabled={isMutationLoading || isUploading}
                onClick={updateLectureHandler}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                {isMutationLoading || isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                    Please wait
                  </>
                ) : (
                  "Update Lecture"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/admin/courses/${courseId}`)}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LectureTab;