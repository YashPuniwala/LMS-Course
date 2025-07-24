import React, { useState, FormEvent, useEffect } from "react";
import { X } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { AlertCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SearchResult from "./searchResult";
import Filter from "./filter";
import { useSearchCourseQuery } from "@/features/api/courseApi";

type FilterChangeHandler = (categories: string[], sort: string, price: string) => void;

const sortOptions = [
  { value: "price", label: "Price: Low to High" },
  { value: "-price", label: "Price: High to Low" },
  { value: "popularity", label: "Popularity" },
  { value: "-createdAt", label: "Newest" },
  { value: "title", label: "A-Z" },
  { value: "-title", label: "Z-A" },
];

const priceOptions = [
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
];


const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("query") || "";
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState(query);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSort, setSelectedSort] = useState<string>("-createdAt"); // Added selectedSort state
  const [priceFilter, setPriceFilter] = useState<string>("all"); // Changed default to "all"

  // Fetch courses based on query, sort, and categories
  const { data, isLoading, isFetching } = useSearchCourseQuery({
    query,
    sortBy: selectedSort,
    categories: selectedCategories.join(","),
  });

  const isEmpty = !isLoading && !isFetching && data?.courses.length === 0;

  // Handle search submission
  const searchHandler = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim() !== "") {
      navigate(`/course/search?query=${searchQuery}`);
    }
  };

  const handleFilterChange: FilterChangeHandler = (categories, sort, price) => {
    setSelectedCategories(categories);
    setSelectedSort(sort);
    setPriceFilter(price);
  };

  // Reset filters when search query changes
  useEffect(() => {
    setSelectedCategories([]);
    setSelectedSort("-createdAt");
    setPriceFilter("all");
  }, [query]);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 bg-gray-50 min-h-screen">
      {/* Search Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Find Your Perfect Course
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Browse our extensive catalog to boost your skills and career
        </p>
      </div>

      {/* Search Input */}
      <form
        onSubmit={searchHandler}
        className="flex items-center bg-white rounded-xl shadow-sm overflow-hidden max-w-2xl mx-auto mb-12 border border-gray-200 hover:border-blue-400 transition-colors duration-300"
      >
        <div className="pl-5 text-gray-400">
          <Search className="h-5 w-5" />
        </div>
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for courses, topics, or instructors..."
          className="flex-grow border-none focus-visible:ring-0 px-4 py-6 text-gray-900 placeholder-gray-400 text-lg"
        />
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              navigate("/course/search"); // Reset search results
            }}
            className="text-gray-500 hover:text-gray-700 pr-4"
          >
            <X className="h-5 w-5" />
          </button>
        <Button
          type="submit"
          className="bg-blue-600 text-white px-8 py-6 rounded-r-xl hover:bg-blue-700 transition-colors duration-300 h-full"
        >
          Search
        </Button>
      </form>

      {/* Main Content Area */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Filter Sidebar */}
        <div className="w-full md:w-72 flex-shrink-0">
          <Filter
            handleFilterChange={handleFilterChange}
            selectedCategories={selectedCategories}
            selectedSort={selectedSort}
            selectedPrice={priceFilter}
          />
        </div>

        {/* Results Area */}
        <div className="flex-1">
          {/* Search Results Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">
                {query ? `Results for "${query}"` : "All Courses"}
              </h2>
              <span className="text-sm text-gray-500">
                {data?.courses.length || 0} courses found
              </span>
            </div>

            {/* Active Filters */}
            {(selectedCategories.length > 0 || priceFilter !== "all" || selectedSort !== "-createdAt") && (
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="text-sm font-medium text-gray-700">
                  Filters:
                </span>
                {selectedCategories.map((category) => (
                  <span
                    key={category}
                    className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full flex items-center"
                  >
                    {category}
                    <button
                      onClick={() => {
                        const newCategories = selectedCategories.filter(
                          (c) => c !== category
                        );
                        handleFilterChange(newCategories, selectedSort, priceFilter);
                      }}
                      className="ml-2 text-blue-500 hover:text-blue-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {/* {priceFilter !== "all" && (
                  <span className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full flex items-center">
                    {priceFilter === "free" ? "Free" : "Paid"}
                    <button
                      onClick={() => handleFilterChange(selectedCategories, selectedSort, "all")}
                      className="ml-2 text-blue-500 hover:text-blue-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )} */}
                {selectedSort !== "-createdAt" && (
                  <span className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full flex items-center">
                    {sortOptions.find(opt => opt.value === selectedSort)?.label}
                    <button
                      onClick={() => handleFilterChange(selectedCategories, "-createdAt", priceFilter)}
                      className="ml-2 text-blue-500 hover:text-blue-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {(selectedCategories.length > 0 || priceFilter !== "all" || selectedSort !== "-createdAt") && (
                  <button
                    onClick={() => {
                      setSelectedCategories([]);
                      setSelectedSort("-createdAt");
                      setPriceFilter("all");
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 ml-2"
                  >
                    Clear all
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Search Results */}
          <div className="space-y-6">
            {isLoading || isFetching ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <CourseSkeleton key={idx} />
              ))
            ) : isEmpty ? (
              <CourseNotFound />
            ) : (
              data?.courses?.map((course) => (
                <SearchResult key={course._id} course={course} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;

// ... (keep the existing CourseNotFound and CourseSkeleton components)

const CourseNotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 bg-white rounded-xl shadow-sm border border-gray-200 text-center">
      <div className="bg-red-50 p-4 rounded-full mb-6">
        <AlertCircle className="text-red-500 h-12 w-12" />
      </div>
      <h1 className="font-bold text-2xl text-gray-800 mb-3">
        No Courses Found
      </h1>
      <p className="text-gray-600 mb-6 max-w-md">
        We couldn't find any courses matching your search. Try adjusting your
        filters or search for something different.
      </p>
      <Link to="/course/search">
        <Button
          variant="outline"
          className="border-blue-500 text-blue-600 hover:bg-blue-50"
        >
          Browse All Courses
        </Button>
      </Link>
    </div>
  );
};

const CourseSkeleton = () => {
  return (
    <div className="flex flex-col md:flex-row gap-6 p-6 bg-white rounded-xl shadow-sm border border-gray-200">
      <Skeleton className="h-40 w-full md:w-56 rounded-lg" />
      <div className="flex-1 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>
      <div className="md:w-32 flex md:flex-col justify-between">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>
    </div>
  );
};
