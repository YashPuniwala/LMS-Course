import { ThemeProvider } from "./components/themeProvider";
import MainLayout from "./layout/mainLayout";
import Login from "./pages/login";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import HeroSection from "./pages/student/heroSection";
import Courses from "./pages/student/courses";
import MyLearning from "./pages/student/myLearning";
import Profile from "./pages/student/profile";
import Sidebar from "./pages/admin/sidebar";
import Dashboard from "./pages/admin/dashboard";
import CourseTable from "./pages/admin/course/courseTable";
import AddCourse from "./pages/admin/course/createCourse";
import EditCourse from "./pages/admin/course/editCourse";
import CreateLecture from "./pages/admin/lecture/createLecture";
import EditLecture from "./pages/admin/lecture/editLecture";
import EditSubLecture from "./pages/admin/subLecture/editSubLecture";
import CourseDetail from "./pages/student/courseDetail";
import CourseProgress from "./pages/student/courseProgress";
import SearchPage from "./pages/student/searchPage";
import {
  AdminRoute,
  AuthenticatedUser,
  ProtectedRoute,
} from "./components/protectedRoute";
import PurchaseCourseProtectedRoute from "./components/purchaseCourseProtectedRoute";

const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        path: "/",
        element: (
          <>
            <HeroSection />
            <Courses />
          </>
        ),
      },
      {
        path: "/my-learning",
        element: (
          <ProtectedRoute>
            <MyLearning />
          </ProtectedRoute>
        ),
      },
      {
        path: "/profile",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: "login",
        element: (
          <AuthenticatedUser>
            <Login />
          </AuthenticatedUser>
        ),
      },
      {
        path: "course/search",
        element: (
          // <ProtectedRoute>
            <SearchPage />
          // </ProtectedRoute>
        ),
      },
      {
        path: "course-detail/:courseId",
        element: (
          <ProtectedRoute>
            <CourseDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: "course-progress/:courseId",
        element: (
          <ProtectedRoute>
            <PurchaseCourseProtectedRoute>
              <CourseProgress />
            </PurchaseCourseProtectedRoute>
          </ProtectedRoute>
        ),
      },
      // {
      //   path: "course-progress/:courseId",
      //   element: <CourseProgress />,
      // },

      // Admin Routes

      {
        path: "admin",
        element: (
          <AdminRoute>
            <Sidebar />
          </AdminRoute>
        ),
        children: [
          {
            path: "dashboard",
            element: <Dashboard />,
          },
          {
            path: "courses",
            element: <CourseTable />,
          },
          {
            path: "courses/create",
            element: <AddCourse />,
          },
          {
            path: "courses/:courseId",
            element: <EditCourse />,
          },
          {
            path: "courses/:courseId/lecture",
            element: <CreateLecture />,
          },
          {
            path: "courses/:courseId/lecture/:lectureId",
            element: <EditLecture />,
          },
          {
            path: "courses/:lectureId/lecture/:subLectureId",
            element: <EditSubLecture />,
          },
        ],
      },
    ],
  },
]);

function App() {
  return (
    <main>
        <RouterProvider router={appRouter} />
    </main>
  );
}

export default App;
