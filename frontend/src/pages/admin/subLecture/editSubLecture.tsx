import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import React from "react";
import { Link, useParams } from "react-router-dom";
import SubLectureTab from "./subLectureTab";

const EditSubLecture = () => {
  const { lectureId, subLectureId } = useParams();

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Link to={`/admin/lectures/${lectureId}/sublectures/${subLectureId}`}>
            <Button size="icon" variant="outline" className="rounded-full">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <h1 className="font-bold text-xl">Update Your Sub-Lecture</h1>
        </div>
      </div>
      <SubLectureTab />
    </div>
  );
};

export default EditSubLecture;