import React from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

// Define the type for the input state
export interface CourseInputState {
  courseTitle: string;
  isFree: boolean;
  subTitle: string;
  description: string;
  category: string;
  courseLevel: string;
  coursePrice: string;
  courseThumbnail: string | File;
  tutorialDescription: string;
}

// Define the props for the component with flexible setInput
interface RichTextEditorProps {
  input: CourseInputState;
  setInput: ((newState: CourseInputState) => void) | ((value: string) => void);
  fieldName?: "description" | "tutorialDescription";
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  input, 
  setInput,
  fieldName = "description" // Default to description if not specified
}) => {
  // Get the current value from the input object based on fieldName
  const currentValue = input[fieldName] || '';
  
  console.log(`RichTextEditor ${fieldName} value:`, currentValue); // Debug logging
  
  const handleChange = (content: string) => {
    console.log(`RichTextEditor ${fieldName} changed to:`, content); // Debug logging
    
    // Check how setInput was passed and call it appropriately
    if (typeof setInput === "function") {
      // If it's a string-accepting function (for tutorial description)
      if (fieldName === "tutorialDescription") {
        (setInput as (value: string) => void)(content);
      } else {
        // If it's for the whole state object
        (setInput as (state: CourseInputState) => void)({ ...input, [fieldName]: content });
      }
    }
  };

  return (
    <ReactQuill 
      theme="snow" 
      value={currentValue} 
      onChange={handleChange} 
    />
  );
};

export default RichTextEditor;