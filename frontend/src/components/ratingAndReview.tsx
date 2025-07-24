import { Star, StarHalf, MessageSquare, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
  useGetCourseReviewsQuery,
  useGetUserReviewForCourseQuery,
} from "@/features/api/reviewApi";
import { RootState } from "@/app/store";
import { useSelector } from "react-redux";
import { User } from "@/types/types";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface RatingProps {
  courseId: string;
}

const RatingAndReviews: React.FC<RatingProps> = ({ courseId }) => {
  const { user } = useSelector((store: RootState) => store.auth) as {
    user: User | null;
  };
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [currentReviewId, setCurrentReviewId] = useState("");

  // API calls
  const {
    data: reviewsData,
    isLoading: isReviewsLoading,
    refetch: refetchReviews,
  } = useGetCourseReviewsQuery({ courseId });
  const {
    data: userReviewData,
    isLoading: isUserReviewLoading,
    refetch: refetchUserReview,
  } = useGetUserReviewForCourseQuery({ courseId }, { skip: !user });
  const [createReview] = useCreateReviewMutation();
  const [updateReview] = useUpdateReviewMutation();
  const [deleteReview] = useDeleteReviewMutation();

  useEffect(() => {
    setRating(0);
    setReviewText("");
    setIsEditing(false);
    setCurrentReviewId("");
    if (user) {
      refetchUserReview();
    } else {
      setRating(0);
      setReviewText("");
      setCurrentReviewId("");
      setIsEditing(false);
    }
  }, [user, refetchUserReview]);

  // Calculate average rating
  const averageRating = reviewsData?.reviews
    ? reviewsData.reviews.reduce((acc, review) => acc + review.rating, 0) /
      (reviewsData.reviews.length || 1)
    : 0;
  const ratingCounts = [0, 0, 0, 0, 0]; // For 1-5 stars
  reviewsData?.reviews.forEach((review) => {
    ratingCounts[review.rating - 1]++;
  });

  useEffect(() => {
    if (userReviewData?.review) {
      setRating(userReviewData.review.rating);
      setReviewText(userReviewData.review.review || "");
      setCurrentReviewId(userReviewData.review._id);
    } else {
      // Clear form if no review exists for current user
      setRating(0);
      setReviewText("");
      setCurrentReviewId("");
      setIsEditing(false);
    }
  }, [userReviewData]);

  const handleSubmitReview = async () => {
    if (!user) {
      return;
    }

    if (rating === 0) {
      return;
    }

    try {
      if (isEditing && currentReviewId) {
        const result = await updateReview({
          reviewId: currentReviewId,
          rating,
          review: reviewText,
        }).unwrap();
        if (result.success) {
          setIsEditing(false);
        }
      } else {
        const result = await createReview({
          courseId,
          rating,
          review: reviewText,
        }).unwrap();
        if (result.success) {
          setCurrentReviewId(result.review?._id || "");
        }
      }
      refetchReviews();
      refetchUserReview();
    } catch (error) {
      console.log(error);
    }
  };

  const handleDeleteReview = async () => {
    if (!currentReviewId) return;

    try {
      const result = await deleteReview({ reviewId: currentReviewId }).unwrap();
      if (result.success) {
        setRating(0);
        setReviewText("");
        setCurrentReviewId("");
        setIsEditing(false);
        refetchReviews();
        refetchUserReview();
      }
    } catch (error) {}
  };

  const renderStars = (avgRating: number) => {
    const stars = [];
    const fullStars = Math.floor(avgRating);
    const hasHalfStar = avgRating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <StarHalf
            key={i}
            className="w-5 h-5 fill-yellow-400 text-yellow-400"
          />
        );
      } else {
        stars.push(<Star key={i} className="w-5 h-5 text-gray-300" />);
      }
    }

    return stars;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left side - Rating summary */}
        <div className="w-full lg:w-1/3 space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">
                Course Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isReviewsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-32 mx-auto" />
                  <Skeleton className="h-4 w-48 mx-auto" />
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-3 flex-grow" />
                        <Skeleton className="h-4 w-8" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-center mb-4">
                    <div className="text-5xl font-bold text-blue-600 mb-2">
                      {averageRating.toFixed(1)}
                    </div>
                    <div className="flex justify-center mb-1">
                      {renderStars(averageRating)}
                    </div>
                    <p className="text-gray-600">
                      Based on {reviewsData?.reviews.length || 0} reviews
                    </p>
                  </div>

                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((star) => (
                      <div key={star} className="flex items-center gap-2">
                        <div className="flex w-20">
                          {[...Array(star)].map((_, i) => (
                            <Star
                              key={i}
                              className="w-4 h-4 fill-yellow-400 text-yellow-400"
                            />
                          ))}
                        </div>
                        <div className="flex-grow h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-400"
                            style={{
                              width: `${
                                (ratingCounts[star - 1] /
                                  (reviewsData?.reviews.length || 1)) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-8">
                          {ratingCounts[star - 1]}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Leave a review card */}
          {user && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold">
                  {userReviewData?.review
                    ? "Update Your Review"
                    : "Leave a Review"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Your Rating</p>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="focus:outline-none"
                      >
                        {(hoverRating || rating) >= star ? (
                          <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
                        ) : (
                          <Star className="w-8 h-8 text-gray-300" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Your Review</p>
                  <Textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share your experience with this course..."
                    className="min-h-[120px]"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleSubmitReview}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isEditing ? "Update Review" : "Submit Review"}
                  </Button>
                  {userReviewData?.review && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(!isEditing)}
                        className="border-blue-600 text-blue-600 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        {isEditing ? "Cancel" : "Edit"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleDeleteReview}
                        className="border-red-600 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right side - Reviews list */}
        <div className="w-full lg:w-2/3 space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold">Reviews</CardTitle>
                <div className="flex items-center gap-2">
                  <MessageSquare className="text-blue-500" />
                  <span className="font-medium">
                    {reviewsData?.reviews.length || 0} reviews
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isReviewsLoading ? (
                <div className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((j) => (
                          <Skeleton key={j} className="h-5 w-5 mr-1" />
                        ))}
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Separator className="my-4" />
                    </div>
                  ))}
                </div>
              ) : reviewsData?.reviews.length ? (
                <div className="space-y-6">
                  {reviewsData.reviews.map((review) => (
                    <div key={review._id} className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={
                              review.user.photoUrl ||
                              "https://github.com/shadcn.png"
                            }
                            alt={review.user.name}
                          />
                          <AvatarFallback>
                            {review.user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{review.user.name}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${
                              i < review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      {review.review && (
                        <p className="text-gray-700">{review.review}</p>
                      )}
                      <Separator className="my-4" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">
                    No reviews yet
                  </h3>
                  <p className="mt-1 text-gray-500">
                    Be the first to share your thoughts about this course!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RatingAndReviews;
