import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const searchHandler = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim() !== "") {
      navigate(`/course/search?query=${searchQuery}`);
    }
    setSearchQuery("");
  };

  return (
    <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 py-20 px-4 text-center overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10">
        <div className="absolute top-20 left-10 w-40 h-40 rounded-full bg-blue-400 blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-indigo-400 blur-xl"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Heading Section */}
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Discover & Master
            </span>{" "}
            New Skills
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join thousands of learners and access premium courses taught by industry experts.
          </p>
        </div>

        {/* Search Bar */}
        <form
          onSubmit={searchHandler}
          className="flex items-center bg-white border border-gray-200 rounded-full overflow-hidden shadow-lg mt-8 hover:shadow-xl transition-shadow duration-300"
        >
          <div className="flex-grow relative">
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for courses, topics, or instructors..."
              className="flex-grow border-none focus-visible:ring-0 pl-12 pr-6 py-4 text-gray-800 placeholder-gray-400"
            />
          </div>
          <Button
            type="submit"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-r-full transition-all duration-300 hover:shadow-md"
          >
            Search
          </Button>
        </form>

        {/* Popular tags */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <span className="text-sm text-gray-500">Popular:</span>
          {['NextJS', 'Data Science', 'Frontend Development', 'Fullstack Development', 'Mern Stack Development', "Javascript", "Python", "Docker", "MongoDB", "HTML"].map((tag) => (
            <button
              key={tag}
              onClick={() => navigate(`/course/search?query=${tag}`)}
              className="text-sm px-3 py-1 rounded-full bg-white text-blue-600 hover:bg-blue-50 transition-colors duration-200"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <Button
            onClick={() => navigate(`/course/search?query`)}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full hover:shadow-md transition-all duration-300"
          >
            Browse All Courses
          </Button>
        </div>

        {/* Trust indicators */}
        <div className="mt-12 flex flex-col items-center">
          <div className="flex -space-x-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <img
                key={i}
                src={`https://randomuser.me/api/portraits/${i % 2 === 0 ? 'women' : 'men'}/${i}.jpg`}
                alt="User"
                className="w-10 h-10 rounded-full border-2 border-white"
              />
            ))}
          </div>
          <p className="mt-3 text-sm text-gray-500">
            Join <span className="font-medium text-gray-700">10,000+</span> happy learners
          </p>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;