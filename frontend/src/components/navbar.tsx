import { BookOpen, Menu, Search, Bell, Home, User as UserIcon, LogOut, Bookmark, Settings, ChevronDown } from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useLogoutMutation } from "@/features/api/authApi";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store";
import { User } from "../types/types";
import { Input } from "./ui/input";

const Navbar: React.FC = () => {
  const { user } = useSelector((store: RootState) => store.auth) as {
    user: User | null;
  };
  const [logoutUser, { data, isSuccess }] = useLogoutMutation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const logoutHandler = async () => {
    await logoutUser();
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success(data?.message || "User logged out successfully");
      navigate("/login");
    }
  }, [isSuccess, data, navigate]);

  const navLinks = [
    { name: "Courses", path: "/courses" },
    { name: "Community", path: "/community" },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? "bg-white shadow-md" : "bg-blue-50/80 backdrop-blur-sm"
    }`}>
      {/* Desktop Navbar */}
      <div className="max-w-7xl mx-auto hidden lg:flex justify-between items-center h-16 px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
            <BookOpen size={24} className="text-white" />
          </div>
          <Link to="/" className="flex items-center">
            <h1 className="font-extrabold text-2xl bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
              E-Learning
            </h1>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-1">
          {/* {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive(link.path)
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:bg-blue-50"
              }`}
            >
              {link.name}
            </Link>
          ))} */}
          
          {/* <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 rounded-md"
              >
                Resources
                <ChevronDown size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-white border border-gray-200 shadow-lg">
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <Link to="/tutorials" className="flex w-full">Tutorials</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link to="/webinars" className="flex w-full">Webinars</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link to="/blog" className="flex w-full">Blog</Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu> */}
        </nav>

        {/* User Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-2 cursor-pointer">
                    <Avatar className="h-9 w-9 border-2 border-blue-200">
                      <AvatarImage src={user.photoUrl} alt={user.name} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                        {user.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-gray-800">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.role}</p>
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-white border border-gray-200 shadow-lg">
                  <div className="p-2 border-b border-gray-100 md:hidden">
                    <p className="font-medium text-gray-800">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <DropdownMenuGroup>
                    <DropdownMenuItem>
                      <Link to="/profile" className="flex items-center w-full">
                        <UserIcon size={16} className="mr-2 text-gray-500" />
                        <span>My Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link to="/my-learning" className="flex items-center w-full">
                        <Bookmark size={16} className="mr-2 text-gray-500" />
                        <span>My Courses</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  
                  {user?.role === "instructor" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                        Instructor
                      </DropdownMenuLabel>
                      <DropdownMenuItem>
                        <Link to="/admin/dashboard" className="flex items-center w-full">
                          <Home size={16} className="mr-2 text-gray-500" />
                          <span>Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Link to="/admin/courses" className="flex items-center w-full">
                          <BookOpen size={16} className="mr-2 text-gray-500" />
                          <span>My Courses</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logoutHandler} className="text-red-500 focus:text-red-500 focus:bg-red-50">
                    <LogOut size={16} className="mr-2" />
                    <span>Log Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => navigate("/login")}
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                Log In
              </Button>
              <Button
                onClick={() => navigate("/signup")}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navbar */}
      <div className="flex lg:hidden items-center justify-between px-4 h-16">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-1.5 rounded-md mr-2">
              <BookOpen size={20} className="text-white" />
            </div>
            <h1 className="font-bold text-xl bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
              E-Learning
            </h1>
          </Link>
        </div>
        
        <div className="flex items-center gap-3">
          
          <MobileNavbar user={user} logoutHandler={logoutHandler} />
        </div>
      </div>
    </div>
  );
};

// Mobile Navbar Component
interface MobileNavbarProps {
  user: User | null;
  logoutHandler: () => Promise<void>;
}

const MobileNavbar: React.FC<MobileNavbarProps> = ({ user, logoutHandler }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const navLinks = [
    { name: "Home", path: "/", icon: <Home size={18} /> },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          size="icon"
          className="rounded-full hover:bg-blue-50 text-gray-600"
          variant="ghost"
        >
          <Menu size={22} />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:w-80 p-0">
        <div className="flex flex-col h-full bg-white">
          <SheetHeader className="p-4 border-b">
            {user ? (
              <div className="flex items-center gap-3 mb-2">
                <Avatar className="h-12 w-12 border-2 border-blue-200">
                  <AvatarImage src={user.photoUrl} alt={user.name} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-800">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 py-4">
                <SheetTitle className="text-lg mb-2">Welcome to E-Learning</SheetTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => navigate("/login")}
                    className="flex-1 border-blue-600 text-blue-600"
                  >
                    Log In
                  </Button>
                  <Button
                    onClick={() => navigate("/signup")}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                  >
                    Sign Up
                  </Button>
                </div>
              </div>
            )}
          </SheetHeader>
          
          <div className="p-4">
           
          </div>
          
          <nav className="px-2 py-4 flex-1 overflow-y-auto">
            <div className="space-y-1">
              {navLinks.map((link) => (
                <SheetClose asChild key={link.name}>
                  <Link
                    to={link.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive(link.path)
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-700 hover:bg-blue-50"
                    }`}
                  >
                    {link.icon}
                    <span>{link.name}</span>
                  </Link>
                </SheetClose>
              ))}
            </div>
            
            {user && (
              <>
                <div className="mt-6 mb-2 px-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Your Account
                  </h3>
                </div>
                <div className="space-y-1">
                  <SheetClose asChild>
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-blue-50"
                    >
                      <UserIcon size={18} />
                      <span>Profile</span>
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      to="/my-learning"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-blue-50"
                    >
                      <Bookmark size={18} />
                      <span>My Courses</span>
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      to="/settings"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-blue-50"
                    >
                      <Settings size={18} />
                      <span>Settings</span>
                    </Link>
                  </SheetClose>
                </div>
              </>
            )}
            
            {user?.role === "instructor" && (
              <>
                <div className="mt-6 mb-2 px-4">
                  <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                    Instructor
                  </h3>
                </div>
                <div className="space-y-1">
                  <SheetClose asChild>
                    <Link
                      to="/admin/dashboard"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-blue-50"
                    >
                      <Home size={18} />
                      <span>Dashboard</span>
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      to="/admin/courses"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-blue-50"
                    >
                      <BookOpen size={18} />
                      <span>My Courses</span>
                    </Link>
                  </SheetClose>
                </div>
              </>
            )}
          </nav>
          
          {user && (
            <SheetFooter className="p-4 border-t">
              <Button
                onClick={logoutHandler}
                className="w-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                variant="outline"
              >
                <LogOut size={18} className="mr-2" />
                Log Out
              </Button>
            </SheetFooter>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default Navbar;