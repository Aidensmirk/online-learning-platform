import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { NotificationProvider } from "./context/NotificationContext";
import Notifications from "./components/NotificationBell";

import CreateCourse from './pages/CreateCourse';
import ProtectedRoute from './components/ProtectedRoute';
import Register from "./pages/Register";
import Login1 from "./pages/Login1";
import MyCourses from "./pages/MyCourses";
import InstructorDashboard from './pages/InstructorDashboard';
import StudentDashboard from "./pages/StudentDashboard";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import AllCourses from "./pages/AllCourses";
import CoursePlayer from "./pages/CoursePlayer";
import CourseDetails from "./pages/CourseDetails";
import ManageCourses from "./pages/ManageCourses";
import EditCourse from "./pages/EditCourse";
import RoleBasedRoute from "./components/RoleBasedRoute";
import PaymentPage from "./pages/PaymentPage";
import Wishlist from "./pages/Wishlist";
import About from "./pages/About";
import AssignmentReview from "./pages/AssignmentReview";
import AdminAnalytics from "./pages/AdminAnalytics";
import Messaging from "./pages/Messaging";

function App(){
  return (
    <NotificationProvider>
      <Notifications />
      <div className="app-shell">
        <div className="app-shell__gradient" aria-hidden />
        <Router>
          <main className="app-main">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/all-courses" element={<AllCourses />} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<Login1 />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/instructor-dashboard"
                element={
                  <RoleBasedRoute allowedRoles={["instructor", "admin"]}>
                    <InstructorDashboard />
                  </RoleBasedRoute>
                }
              />
              <Route path="/student-dashboard" element={<StudentDashboard />} />
              <Route path="/my-courses" element={<MyCourses />} />
              <Route
                path="/create-course"
                element={
                  <RoleBasedRoute allowedRoles={["instructor", "admin"]}>
                    <CreateCourse />
                  </RoleBasedRoute>
                }
              />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><Messaging /></ProtectedRoute>} />
              <Route path="/course-player/:courseId" element={<ProtectedRoute><CoursePlayer /></ProtectedRoute>} />
              <Route path="/course-details/:courseId" element={<CourseDetails />} />
              <Route
                path="/manage-courses"
                element={
                  <RoleBasedRoute allowedRoles={["instructor", "admin"]}>
                    <ManageCourses />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/edit-course/:courseId"
                element={
                  <RoleBasedRoute allowedRoles={["instructor", "admin"]}>
                    <EditCourse />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/assignments/:assignmentId/review"
                element={
                  <RoleBasedRoute allowedRoles={["instructor", "admin"]}>
                    <AssignmentReview />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/admin-analytics"
                element={
                  <RoleBasedRoute allowedRoles={["admin"]}>
                    <AdminAnalytics />
                  </RoleBasedRoute>
                }
              />
              <Route path="/payment" element={<PaymentPage />} />
              <Route path="/wishlist" element={<Wishlist />} />
            </Routes>
          </main>
        </Router>
      </div>
    </NotificationProvider>
  );
}

export default App;