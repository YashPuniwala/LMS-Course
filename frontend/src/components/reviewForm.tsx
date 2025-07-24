import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import StarRating from "./startRating";
import { Textarea } from "./ui/textarea";

interface ReviewFormProps {
  initialRating?: number;
  initialReview?: string;
  onCancel: () => void;
  onSubmit: (rating: number, review: string) => Promise<void>;
  isSubmitting: boolean;
  isUpdate?: boolean;
}

const ReviewForm = ({
  initialRating = 0,
  initialReview = "",
  onCancel,
  onSubmit,
  isSubmitting,
  isUpdate = false,
}: ReviewFormProps) => {
  const [rating, setRating] = useState(initialRating);
  const [review, setReview] = useState(initialReview);

  const handleSubmit = async () => {
    await onSubmit(rating, review);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-2">
          {isUpdate ? "Update Your Review" : "Write a Review"}
        </h3>
        <StarRating rating={rating} setRating={setRating} editable />
      </div>
      <Textarea
        placeholder="Share your thoughts about this course..."
        value={review}
        onChange={(e) => setReview(e.target.value)}
        className="min-h-[120px]"
      />
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || rating === 0}
        >
          {isSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {isUpdate ? "Update Review" : "Submit Review"}
        </Button>
      </div>
    </div>
  );
};

export default ReviewForm;