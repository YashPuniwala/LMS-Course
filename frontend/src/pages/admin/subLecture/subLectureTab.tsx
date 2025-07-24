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
  useEditSubLectureMutation,
  useGetSingleLectureSubLecturesQuery,
  useRemoveSubLectureMutation,
} from "@/features/api/courseApi";
import { Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

const SubLectureTab: React.FC = () => {
  const [input, setInput] = useState<{
    subLectureTitle: string;
    videoFile: File | null;
  }>({
    subLectureTitle: "",
    videoFile: null,
  });

  const params = useParams();
  const lectureId = params.lectureId || "";
  const subLectureId = params.subLectureId || "";
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [editSubLecture, { isLoading: isMutationLoading, isSuccess, error }] =
    useEditSubLectureMutation();
  const [
    removeSubLecture,
    { data: removeData, isLoading: removeLoading, isSuccess: removeSuccess },
  ] = useRemoveSubLectureMutation();
  const {
    data: subLectureData,
    isLoading: subLectureIsLoading,
    isSuccess: subLectureIsSuccess,
  } = useGetSingleLectureSubLecturesQuery(
    { lectureId }, 
    { skip: !lectureId }
  );

  const navigate = useNavigate();

  useEffect(() => {
  if (subLectureIsSuccess && subLectureData?.subLecture) {
    const subLecture = subLectureData.subLecture;
    setInput({
      subLectureTitle: subLecture.subLectureTitle || "",
      videoFile: null,
    });

    if (subLecture.videoUrl) {
      setPreviewVideo(subLecture.videoUrl);
    }
  }
}, [subLectureIsSuccess, subLectureData]);

  const changeEventHandler = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setInput({ ...input, [name]: value });
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
        isSuccess ? "Sub-lecture updated successfully" : "Failed to update sub-lecture"
      );
      if (isSuccess) navigate(`/admin/lectures/${lectureId}`);
    }
  }, [isSuccess, error, navigate, lectureId]);

  const updateSubLectureHandler = async () => {
    if (!lectureId || !subLectureId) return;
  
    const formData = new FormData();
    formData.append("subLectureTitle", input.subLectureTitle);
    if (input.videoFile) formData.append("videoFile", input.videoFile);
  
    setIsUploading(true);
  
    await editSubLecture({ formData, lectureId, subLectureId });
  
    setIsUploading(false);
  };

  const removeSubLectureHandler = async () => {
    await removeSubLecture({ lectureId, subLectureId });
  };

  useEffect(() => {
    if (removeSuccess) {
      toast.success(removeData.message);
      navigate(`/admin/lectures/${lectureId}`);
    }
  }, [removeSuccess, removeData, navigate, lectureId]);

  if (subLectureIsLoading) return <h1>Loading...</h1>;

  return (
    <Card>
      <CardHeader className="flex justify-between">
        <div>
          <CardTitle>Edit Sub-Lecture</CardTitle>
          <CardDescription>
            Make changes and click save when done.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            disabled={removeLoading}
            variant="destructive"
            onClick={removeSubLectureHandler}
          >
            {removeLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait
              </>
            ) : (
              "Remove Sub-Lecture"
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div>
          <Label>Title</Label>
          <Input
            type="text"
            name="subLectureTitle"
            value={input.subLectureTitle}
            onChange={changeEventHandler}
            placeholder="Ex. Introduction to Variables"
          />
        </div>
        <div className="my-5">
          <Label>
            Video <span className="text-red-500">*</span>
          </Label>
          <Input
            type="file"
            accept="video/*"
            onChange={selectVideoFile}
            className="w-fit"
          />
          {previewVideo && (
            <video
              src={previewVideo}
              controls
              className="w-full max-w-md mt-2"
            />
          )}
        </div>

        <div className="mt-4">
          <Button
            disabled={isMutationLoading || isUploading}
            onClick={updateSubLectureHandler}
          >
            {isMutationLoading || isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait
              </>
            ) : (
              "Update Sub-Lecture"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubLectureTab;