import { Skeleton } from "@/components/ui/skeleton";
import StarRating from "../startRating";

interface RatingSummaryProps {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    [key: number]: number;
  };
  isLoading?: boolean;
}

const RatingSummary = ({
  averageRating,
  totalReviews,
  ratingDistribution,
  isLoading = false,
}: RatingSummaryProps) => {
  if (isLoading) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg space-y-4">
        <Skeleton className="h-8 w-24 mx-auto" />
        <Skeleton className="h-6 w-full max-w-xs mx-auto" />
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="flex items-center gap-3">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-2.5 flex-1" />
              <Skeleton className="h-4 w-8" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="text-center md:text-left">
          <h3 className="text-4xl font-bold mb-1">
            {averageRating.toFixed(1)}
          </h3>
          <div className="flex justify-center md:justify-start">
            <StarRating rating={averageRating} size="lg" />
          </div>
          <p className="text-gray-500 mt-1">
            Based on {totalReviews} review{totalReviews !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex-1 max-w-md">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingDistribution[star] || 0;
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

            return (
              <div key={star} className="flex items-center gap-3 mb-2">
                <span className="w-8 text-sm">{star} star</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-yellow-400 h-2.5 rounded-full"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-500 w-8 text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RatingSummary;