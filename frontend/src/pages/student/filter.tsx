import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, ChevronDown } from "lucide-react";
import React from "react";

interface FilterProps {
  handleFilterChange: (
    categories: string[],
    sort: string,
    price: string
  ) => void;
  selectedCategories: string[];
  selectedSort: string;
  selectedPrice: string; // ✅ Added selectedPrice to the interface
}

const categories = [
  "NextJS",
  "Data Science",
  "Frontend Development",
  "Fullstack Development",
  "Mern Stack Development",
  "Javascript",
  "Python",
  "Docker",
  "MongoDB",
  "HTML",
];

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

const Filter = ({
  handleFilterChange,
  selectedCategories,
  selectedSort,
  selectedPrice,
}: FilterProps) => {
  const handleCategoryChange = (value: string) => {
    const newCategories = selectedCategories.includes(value)
      ? selectedCategories.filter((c) => c !== value)
      : [...selectedCategories, value];

    handleFilterChange(newCategories, selectedSort, selectedPrice);
  };

  const removeCategory = (category: string) => {
    const newCategories = selectedCategories.filter((c) => c !== category);
    handleFilterChange(newCategories, selectedSort, selectedPrice);
  };

  const handleSortChange = (sort: string) => {
    handleFilterChange(selectedCategories, sort, selectedPrice);
  };

  const handlePriceChange = (price: string) => {
    handleFilterChange(selectedCategories, selectedSort, price);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h3 className="font-bold text-xl mb-6 text-gray-800 border-b pb-4">
        Filter Courses
      </h3>
      <div className="space-y-8">
        {/* Category Filter */}
        <div>
          <h4 className="font-medium mb-3 text-gray-700">Categories</h4>
          <Select onValueChange={handleCategoryChange} value="">
            <SelectTrigger className="w-full h-12 px-4 border-gray-300 hover:border-blue-400 focus:ring-blue-500">
              <SelectValue placeholder="Select categories" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg mt-1">
              {categories.map((category) => (
                <SelectItem
                  key={category}
                  value={category}
                  className="cursor-pointer hover:bg-gray-50 px-4 py-2"
                >
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {selectedCategories.map((category) => (
                <Badge
                  key={category}
                  variant="outline"
                  className="px-3 py-1 text-sm flex items-center bg-blue-50 text-blue-700 border-blue-200"
                >
                  {category}
                  <button
                    onClick={() => removeCategory(category)}
                    className="ml-2 text-blue-500 hover:text-blue-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Sort By Filter */}
        <div>
          <h4 className="font-medium mb-3 text-gray-700">Sort By</h4>
          <RadioGroup
            value={selectedSort}
            onValueChange={handleSortChange}
            className="space-y-3"
          >
            {sortOptions.map(({ value, label }) => (
              <div key={value} className="flex items-center space-x-3">
                <RadioGroupItem
                  value={value}
                  id={value}
                  className="h-5 w-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <Label htmlFor={value} className="text-gray-700 cursor-pointer">
                  {label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Price Filter */}
        <div>
          <h4 className="font-medium mb-3 text-gray-700">Price</h4>
          <RadioGroup
            value={selectedPrice}
            onValueChange={handlePriceChange}
            className="space-y-3"
          >
            {priceOptions.map(({ value, label }) => (
              <div key={value} className="flex items-center space-x-3">
                <RadioGroupItem
                  value={value}
                  id={value}
                  className="h-5 w-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <Label htmlFor={value} className="text-gray-700 cursor-pointer">
                  {label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>
    </div>
  );
};

export default Filter;
