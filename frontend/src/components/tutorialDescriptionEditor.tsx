import React from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

interface TutorialDescriptionEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const TutorialDescriptionEditor: React.FC<TutorialDescriptionEditorProps> = ({ 
  value, 
  onChange 
}) => {
  console.log("TutorialDescriptionEditor value:", value); // Debug logging
  
  return (
    <ReactQuill 
      theme="snow" 
      value={value || ''} // Ensure value is never undefined
      onChange={onChange} 
    />
  );
};

export default TutorialDescriptionEditor;