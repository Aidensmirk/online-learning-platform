import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
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

function App(){
  return (
    <NotificationProvider>
      <Notifications />
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/all-courses" element={<AllCourses />} />
          <Route path="/login" element={<Login1 />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/instructor-dashboard"
            element={
              <RoleBasedRoute allowedRoles={["instructor"]}>
                <InstructorDashboard />
              </RoleBasedRoute>
            }
          />
  <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/my-courses" element={<MyCourses />} />
          <Route path="/create-course" element={<ProtectedRoute><CreateCourse /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/course-player/:courseId" element={<ProtectedRoute><CoursePlayer /></ProtectedRoute>} />
          <Route path="/course-details/:courseId" element={<CourseDetails />} />
          <Route path="/manage-courses" element={<ManageCourses />} />
          <Route path="/edit-course/:courseId" element={<EditCourse />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/wishlist" element={<Wishlist />} />
        </Routes>
      </Router>
    </NotificationProvider>
  );
}

export default App;