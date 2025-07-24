import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateCourseMutation } from "@/features/api/courseApi";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { Loader2 } from "lucide-react";
import { useEffect, useState, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const AddCourse = () => {
  const [courseTitle, setCourseTitle] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [isFree, setIsFree] = useState(false);

  const [createCourse, { data, error, isSuccess, isLoading }] =
    useCreateCourseMutation();

  const navigate = useNavigate();

  const getSelectedCategory = (value: string): void => {
    setCategory(value);
  };

  const createCourseHandler = async (): Promise<void> => {
    await createCourse({ courseTitle, category, isFree });
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success((data as { message: string })?.message || "Course Created Successfully");
      navigate("/admin/courses");
    }

    if (error) {
      const errorData = (error as FetchBaseQueryError)?.data as {
        message?: string;
      };
      toast.error(errorData?.message || "Failed to create course");
    }
  }, [isSuccess, error, data, navigate]);

  return (
    <div className="flex-1 mx-4 sm:mx-6 md:mx-10 py-4">
      <div className="mb-6">
        <h1 className="font-bold text-lg sm:text-xl md:text-2xl">
          Let's add a course - add some basic details for your new course
        </h1>
        <p className="text-sm text-gray-600 mt-2">
          Provide the essential information to get started with your course creation.
        </p>
      </div>
      
      <div className="space-y-6 max-w-2xl">
        <div className="space-y-2">
          <Label className="text-sm sm:text-base">Title</Label>
          <Input
            type="text"
            value={courseTitle}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setCourseTitle(e.target.value)
            }
            placeholder="Your Course Name"
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm sm:text-base">Category</Label>
          <Select onValueChange={(value) => getSelectedCategory(value)}>
            <SelectTrigger className="w-full sm:w-[280px]">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent className="w-full">
              <SelectGroup>
                <SelectLabel>Categories</SelectLabel>
                <SelectItem value="NextJS">NextJS</SelectItem>
                <SelectItem value="Data Science">Data Science</SelectItem>
                <SelectItem value="Frontend Development">
                  Frontend Development
                </SelectItem>
                <SelectItem value="Fullstack Development">
                  Fullstack Development
                </SelectItem>
                <SelectItem value="MERN Stack Development">
                  MERN Stack Development
                </SelectItem>
                <SelectItem value="Javascript">Javascript</SelectItem>
                <SelectItem value="Python">Python</SelectItem>
                <SelectItem value="Docker">Docker</SelectItem>
                <SelectItem value="MongoDB">MongoDB</SelectItem>
                <SelectItem value="HTML">HTML</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch 
            id="is-free" 
            checked={isFree} 
            onCheckedChange={setIsFree}
            className="data-[state=checked]:bg-green-500"
          />
          <Label htmlFor="is-free" className="text-sm sm:text-base">
            Make this course free
          </Label>
          {isFree && (
            <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
              Free Course
            </span>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={() => navigate("/admin/courses")}
            className="w-full sm:w-auto"
          >
            Back
          </Button>
          <Button 
            disabled={isLoading} 
            onClick={createCourseHandler}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait
              </>
            ) : (
              "Create Course"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddCourse;