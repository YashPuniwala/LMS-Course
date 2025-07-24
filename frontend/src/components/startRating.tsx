import { Star, StarHalf } from "lucide-react";

interface StarRatingProps {
  rating: number;
  setRating?: (rating: number) => void;
  editable?: boolean;
  size?: "sm" | "md" | "lg";
}

const StarRating = ({
  rating,
  setRating,
  editable = false,
  size = "md",
}: StarRatingProps) => {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const handleClick = (newRating: number) => {
    if (editable && setRating) {
      // If clicking the same star that's half filled, make it full
      if (Math.floor(rating) === newRating - 1 && rating % 1 >= 0.5) {
        setRating(newRating);
      } 
      // If clicking the same star that's full, make it half
      else if (Math.floor(rating) === newRating && rating % 1 === 0) {
        setRating(newRating - 0.5);
      } 
      // Otherwise set normally
      else {
        setRating(newRating);
      }
    }
  };

  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      stars.push(
        <button
          key={i}
          type="button"
          onClick={() => handleClick(i)}
          className={editable ? "cursor-pointer" : "cursor-default"}
          disabled={!editable}
        >
          <Star className={`${sizes[size]} fill-yellow-400 text-yellow-400`} />
        </button>
      );
    } else if (i === fullStars + 1 && hasHalfStar) {
      stars.push(
        <button
          key={i}
          type="button"
          onClick={() => handleClick(i)}
          className={editable ? "cursor-pointer" : "cursor-default"}
          disabled={!editable}
        >
          <StarHalf className={`${sizes[size]} fill-yellow-400 text-yellow-400`} />
        </button>
      );
    } else {
      stars.push(
        <button
          key={i}
          type="button"
          onClick={() => handleClick(i)}
          className={editable ? "cursor-pointer" : "cursor-default"}
          disabled={!editable}
        >
          <Star className={`${sizes[size]} text-gray-300`} />
        </button>
      );
    }
  }

  return <div className="flex gap-0.5">{stars}</div>;
};

export default StarRating;