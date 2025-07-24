import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

interface LectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  lectureTitle: string;
  onTitleChange: (value: string) => void;
  onSave: () => void;
  isLoading: boolean;
  isEdit?: boolean;
  onDelete?: () => Promise<void>; // Changed to async function
  isDeleteLoading?: boolean;
}

const LectureModal: React.FC<LectureModalProps> = ({
  isOpen,
  onClose,
  title,
  lectureTitle,
  onTitleChange,
  onSave,
  isLoading,
  isEdit = false,
  onDelete,
  isDeleteLoading = false,
}) => {
  const handleDelete = async () => {
    if (!onDelete) return;
    
    try {
      await onDelete();
      onClose(); // Auto-close on successful deletion
    } catch (error) {
      console.error("Delete operation failed:", error);
      // You might want to add toast notification here
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            {isEdit ? (
              <Pencil className="w-5 h-5" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-gray-700">Lecture Title</Label>
            <Input
              type="text"
              placeholder="Lecture Title"
              value={lectureTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          {isEdit && onDelete && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleteLoading}
              className="mr-auto gap-2"
            >
              {isDeleteLoading ? (
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
          )}
          <Button variant="outline" onClick={onClose} disabled={isLoading || isDeleteLoading}>
            Cancel
          </Button>
          <Button
            disabled={isLoading || isDeleteLoading}
            onClick={onSave}
            className="bg-blue-600 hover:bg-blue-700 gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isEdit ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                {isEdit ? (
                  <Pencil className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {isEdit ? "Save Changes" : "Create Lecture"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LectureModal;