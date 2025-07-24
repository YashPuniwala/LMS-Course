import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ChartNoAxesColumn, Menu, SquareLibrary } from "lucide-react";
import React, { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";


const Sidebar = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      {/* Mobile Sidebar Trigger */}
      <div className="lg:hidden p-4 border-b">
        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[250px]">
            <div className="space-y-6 py-6">
              <Link 
                to="dashboard" 
                className={`flex items-center gap-3 px-4 py-2 rounded-lg ${location.pathname.includes('dashboard') ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
                onClick={() => setMobileSidebarOpen(false)}
              >
                <ChartNoAxesColumn size={18} />
                <span>Dashboard</span>
              </Link>
              <Link 
                to="courses" 
                className={`flex items-center gap-3 px-4 py-2 rounded-lg ${location.pathname.includes('courses') ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
                onClick={() => setMobileSidebarOpen(false)}
              >
                <SquareLibrary size={18} />
                <span>Courses</span>
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 border-r bg-white p-5 sticky top-0 h-screen">
        <div className="space-y-6">
          <h2 className="text-lg font-semibold px-3">Analytics</h2>
          <div className="space-y-2">
            <Link 
              to="dashboard" 
              className={`flex items-center gap-3 px-4 py-2 rounded-lg ${location.pathname.includes('dashboard') ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
            >
              <ChartNoAxesColumn size={18} />
              <span>Dashboard</span>
            </Link>
            <Link 
              to="courses" 
              className={`flex items-center gap-3 px-4 py-2 rounded-lg ${location.pathname.includes('courses') ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
            >
              <SquareLibrary size={18} />
              <span>Courses</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-6 bg-white">
        <Outlet />
      </div>
    </div>
  );
};

export default Sidebar