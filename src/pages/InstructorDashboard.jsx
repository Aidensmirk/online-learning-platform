import { useState, useEffect } from "react";
import { db, auth, storage } from "../Services/firebase";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Link, useNavigate } from "react-router-dom";
import { Bar, Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement } from 'chart.js';
import ErrorBoundary from "../components/ErrorBoundary";
import CourseForm from "../components/CourseForm";
import NotificationBell from "../components/NotificationBell";
import axios from "axios";

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement);

function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate(); // Ensure useNavigate is imported

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return unsubscribe;
  }, []);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      navigate("/login"); // Redirect to login page after logout
    } catch (error) {
      console.error("Sign out error:", error);
      alert("Failed to log out. Please try again.");
    }
  };

  return (
    <nav className="flex justify-between items-center p-4 bg-primary text-white shadow-md">
      <div className="text-xl font-bold">
        <Link to="/" className="hover:text-accent transition-colors duration-200">
          Instructor Portal
        </Link>
      </div>
      <div className="flex space-x-6 items-center">
        <Link to="/instructor-dashboard" className="hover:text-accent transition-colors duration-200">
          Dashboard
        </Link>
        <Link to="/create-course" className="hover:text-accent transition-colors duration-200">
          Create Course
        </Link>
        <Link to="/manage-courses" className="hover:text-accent transition-colors duration-200">
          Manage Courses
        </Link>
        <Link to="/profile" className="hover:text-accent transition-colors duration-200">
          Profile
        </Link>
        <NotificationBell />
        <button onClick={handleSignOut} className="hover:text-accent transition-colors duration-200">
          Logout
        </button>
      </div>
    </nav>
  );
}

export default function InstructorDashboard() {
  const [courses, setCourses] = useState([]);
  const [analytics, setAnalytics] = useState({
    enrollments: { labels: [], datasets: [] },
    revenue: { labels: [], datasets: [] },
    completion: { labels: [], datasets: [] }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: "all",
    status: "all",
    rating: 0
  });
  const [darkMode, setDarkMode] = useState(false);
  const [quickActions, setQuickActions] = useState([
    { id: 1, title: "Create New Course", icon: "plus-circle", action: () => navigate("/create-course") },
    { id: 2, title: "View Analytics", icon: "chart-bar", action: () => setShowAnalytics(true) },
    { id: 3, title: "Manage Notifications", icon: "bell", action: () => setShowNotifications(true) }
  ]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [dashboardSummary, setDashboardSummary] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalRevenue: 0,
    avgRating: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchCourses(), fetchAnalytics(), fetchDashboardSummary()]);
      } catch (error) {
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchCourses = async () => {
    try {
      const q = query(
        collection(db, "courses"),
        where("instructorId", "==", auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const coursesData = querySnapshot.docs.map(doc => ({

        id: doc.id,
        ...doc.data(),
        enrolledCount: doc.data().enrolledCount || 0,
        modules: doc.data().modules || [],
        rating: doc.data().rating || 4.5,
        reviews: doc.data().reviews || []
      }));
      setCourses(coursesData);
      setDashboardSummary(prev => ({
        ...prev,
        totalCourses: coursesData.length,
        totalStudents: coursesData.reduce((total, course) => total + (course.enrolledCount || 0), 0)
      }));
    } catch (error) {
      console.error("Error fetching courses:", error);
      setError("Failed to load courses");
    }
  };

  const fetchAnalytics = async () => {
    try {
      const coursesSnapshot = await getDocs(
        query(collection(db, "courses"), where("instructorId", "==", auth.currentUser.uid))
      );
      const coursesData = coursesSnapshot.docs.map(doc => doc.data());

      // Enrollment Analytics
      const enrolledCounts = coursesData.map(course => course.enrolledCount || 0);
      const courseTitles = coursesData.map(course => course.title);

      // Revenue Analytics
      const revenueData = coursesData.map(course => 
        (course.price || 0) * (course.enrolledCount || 0)
      );

      // Completion Rate Analytics
      const completionRates = coursesData.map(course => 
        course.completedCount ? 
          ((course.completedCount / course.enrolledCount) * 100).toFixed(0) : 
          0
      );

      setAnalytics({
        enrollments: {
          labels: courseTitles,
          datasets: [
            {
              label: "Enrolled Students",
              data: enrolledCounts,
              backgroundColor: "rgba(75, 192, 192, 0.6)",
            },
          ],
        },
        revenue: {
          labels: courseTitles,
          datasets: [
            {
              label: "Revenue ($)",
              data: revenueData,
              backgroundColor: "rgba(54, 162, 235, 0.6)",
            },
          ],
        },
        completion: {
          labels: courseTitles,
          datasets: [
            {
              label: "Completion Rate (%)",
              data: completionRates,
              backgroundColor: "rgba(255, 206, 86, 0.6)",
            },
          ],
        }
      });
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      setError("Failed to load analytics");
    }
  };

  const fetchDashboardSummary = async () => {
    try {
      if (!auth.currentUser) {
        console.error("User is not authenticated");
        return;
      }

      const coursesSnapshot = await getDocs(
        query(collection(db, "courses"), where("instructorId", "==", auth.currentUser.uid))
      );
      const coursesData = coursesSnapshot.docs.map(doc => doc.data());

      const totalRevenue = coursesData.reduce((total, course) => 
        total + (course.price || 0) * (course.enrolledCount || 0), 0
      );

      const avgRating = coursesData.reduce((sum, course) => 
        sum + (course.rating || 4.5), 0
      ) / (coursesData.length || 1);

      setDashboardSummary({
        totalCourses: coursesData.length,
        totalStudents: coursesData.reduce((total, course) => total + (course.enrolledCount || 0), 0),
        totalRevenue,
        avgRating: avgRating.toFixed(1)
      });
    } catch (error) {
      console.error("Error fetching dashboard summary:", error);
    }
  };

  const handleCreateCourse = async ({ title, description, thumbnail, category, price, modules }) => {
    try {
      if (!category) {
        throw new Error("Category is required");
      }

      let thumbnailURL = "";

      // Upload thumbnail to Cloudinary
      if (thumbnail) {
        const formData = new FormData();
        formData.append("file", thumbnail);
        formData.append("upload_preset", "aidens books"); // Replace with your Cloudinary upload preset
        formData.append("cloud_name", "dmi53zthk"); // Replace with your Cloudinary cloud name

        const response = await axios.post(
          "https://api.cloudinary.com/v1_1/dmi53zthk/image/upload", // Replace with your Cloudinary URL
          formData
        );

        thumbnailURL = response.data.secure_url; // Get the uploaded image URL
      }

      // Add course to Firestore
      await addDoc(collection(db, "courses"), {
        title,
        description,
        instructorId: auth.currentUser.uid,
        createdAt: new Date(),
        thumbnailURL,
        status: "draft",
        category, // Ensure category is valid
        price: parseFloat(price),
        modules: modules || [],
        enrolledCount: 0,
        completedCount: 0,
        rating: 4.5,
        reviews: []
      });

      await fetchCourses();
    } catch (error) {
      console.error("Error creating course:", error);
      setError(error.message || "Failed to create course");
    }
  };

  const handleUpdateCourse = async (courseId, updates) => {
    try {
      const courseRef = doc(db, "courses", courseId);
      await updateDoc(courseRef, updates);
      await fetchCourses();
    } catch (error) {
      console.error("Error updating course:", error);
      setError("Failed to update course");
    }
  };

  const handleDeleteCourse = async (courseId) => {
    try {
      await deleteDoc(doc(db, "courses", courseId));
      await fetchCourses();
    } catch (error) {
      console.error("Error deleting course:", error);
      setError("Failed to delete course");
    }
  };

  const fetchNotifications = async () => {
    try {
      const notificationsSnapshot = await getDocs(
        query(
          collection(db, "notifications"),
          where("recipientId", "==", auth.currentUser.uid)
        )
      );
      const notificationsData = notificationsSnapshot.docs.map(doc => ({

        id: doc.id,
        ...doc.data(),
        read: doc.data().read || false
      }));
      setNotifications(notificationsData);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        read: true
      });
      await fetchNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await deleteDoc(doc(db, "notifications", notificationId));
      await fetchNotifications();
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  return (
    <>
      <Navbar />
      
      {error && (
        <div className="bg-red-500 text-white p-4 text-center">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center min-h-screen">
          <div className="loader border-t-4 border-primary rounded-full w-12 h-12 animate-spin"></div>
        </div>
      ) : (
        <div className={`min-h-screen p-8 ${darkMode ? 'bg-gray-800 text-white' : 'bg-gradient-to-b from-gray-50 to-gray-200 text-gray-800'}`}>
          <div className="max-w-4xl mx-auto ${darkMode ? 'bg-gray-900' : 'bg-white'} shadow-xl rounded-2xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-primary">Instructor Dashboard</h2>
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded hover:bg-gray-200 ${darkMode ? 'hover:bg-gray-700' : ''}"
              >
                {darkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>

            {/* Dashboard Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-blue-800' : 'bg-blue-100'} text-center`}>
                <h4 className="text-lg font-semibold">Total Courses</h4>
                <p className="text-2xl font-bold mt-2">{dashboardSummary.totalCourses}</p>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-green-800' : 'bg-green-100'} text-center`}>
                <h4 className="text-lg font-semibold">Total Students</h4>
                <p className="text-2xl font-bold mt-2">{dashboardSummary.totalStudents}</p>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-yellow-800' : 'bg-yellow-100'} text-center`}>
                <h4 className="text-lg font-semibold">Total Revenue</h4>
                <p className="text-2xl font-bold mt-2">${dashboardSummary.totalRevenue.toFixed(2)}</p>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-purple-800' : 'bg-purple-100'} text-center`}>
                <h4 className="text-lg font-semibold">Average Rating</h4>
                <p className="text-2xl font-bold mt-2">
                  {dashboardSummary.avgRating}
                  <span className="text-yellow-500">★</span>
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {quickActions.map(action => (
                <div 
                  key={action.id}
                  className={`p-4 rounded-lg flex items-center space-x-4 hover:bg-gray-100 ${darkMode ? 'hover:bg-gray-700' : ''}`}
                  onClick={action.action}
                >
                  <div className={`p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={`M12 11c0 3.517-1.009 6.799-2.753 9.571m5.642-5.704a1.12 1.12 0 00-1.98 0m-5.642-5.704a1.12 1.12 0 00-1.98 0m5.642-5.704a1.12 1.12 0 00-1.98 0m-3.521 16.942a1.12 1.12 0 01-1.98 0`}></path>
                    </svg>
                  </div>
                  <span className="font-medium">{action.title}</span>
                </div>
              ))}
            </div>

            {/* Course Creation Form */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-primary">Create New Course</h3>
              <CourseForm 
                onSubmit={handleCreateCourse} 
                onEdit={(courseId, updates) => handleUpdateCourse(courseId, updates)}
              />
            </div>

            {/* Filters Section */}
            <div className={`bg-gray-50 p-4 rounded-lg mb-6 ${darkMode ? 'bg-gray-800' : ''} ${showFilters ? 'block' : 'hidden'}`}>
              <div className="flex items-center mb-4">
                <span className="text-gray-500 mr-2">Category:</span>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className={`border p-2 rounded ${darkMode ? 'bg-gray-700 text-white' : ''}`}
                >
                  <option value="all">All Categories</option>
                  <option value="programming">Programming</option>
                  <option value="design">Design</option>
                  <option value="business">Business</option>
                </select>
              </div>
              
              <div className="flex items-center mb-4">
                <span className="text-gray-500 mr-2">Status:</span>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className={`border p-2 rounded ${darkMode ? 'bg-gray-700 text-white' : ''}`}
                >
                  <option value="all">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <span className="text-gray-500 mr-2">Minimum Rating:</span>
                <select
                  value={filters.rating}
                  onChange={(e) => setFilters({ ...filters, rating: parseInt(e.target.value) })}
                  className={`border p-2 rounded ${darkMode ? 'bg-gray-700 text-white' : ''}`}
                >
                  <option value="0">All</option>
                  <option value="3">3 Stars+</option>
                  <option value="4">4 Stars+</option>
                  <option value="4.5">4.5 Stars+</option>
                </select>
              </div>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`text-primary hover:text-accent mb-6 ${darkMode ? 'text-blue-300 hover:text-blue-200' : ''}`}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>

            {/* Courses Grid */}
            <h3 className="text-2xl font-semibold mb-4 text-primary">Your Courses</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {courses
                .filter(course => 
                  (filters.category === "all" || course.category === filters.category) &&
                  (filters.status === "all" || course.status === filters.status) &&
                  (course.rating || 0) >= filters.rating
                )
                .map(course => (
                  <div 
                    key={course.id} 
                    className={`bg-white rounded-xl shadow-md hover:shadow-lg transition duration-300 p-4 ${darkMode ? 'bg-gray-800 text-white' : ''}`}
                  >
                    {course.thumbnailURL && (
                      <img
                        src={course.thumbnailURL}
                        alt={course.title}
                        className="w-full h-40 object-cover rounded-lg mb-4"
                      />
                    )}
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-xl font-bold">{course.title}</h4>
                      <span 
                        className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-gray-700' : ''} ${
                          course.status === "draft" 
                            ? darkMode ? "text-yellow-200" : "text-yellow-800 bg-yellow-100"
                            : course.status === "published"
                              ? darkMode ? "text-green-200" : "text-green-800 bg-green-100"
                              : darkMode ? "text-gray-300" : "text-gray-700 bg-gray-200"
                        }`}
                      >
                        {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                      </span>
                    </div>
                    <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mt-2`}>{course.description}</p>
                    <div className="flex justify-between mt-2">
                      <span className={`${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        {course.modules?.length || 0} Modules
                      </span>
                      <span className={`${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        ${course.price || "Free"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <div className="flex space-x-2">
                        <Link
                          to={`/course-details/${course.id}`}
                          className={`bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                        >
                          View Course
                        </Link>
                        <button
                          onClick={() => handleDeleteCourse(course.id)}
                          className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition ${darkMode ? 'bg-red-600 hover:bg-red-700' : ''}`}
                        >
                          Delete
                        </button>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          <i className="fas fa-users mr-1"></i>
                          {course.enrolledCount || 0}
                        </span>
                        <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          <i className="fas fa-check-circle mr-1"></i>
                          {course.completedCount || 0}
                        </span>
                        <span className={`${darkMode ? 'text-yellow-300' : 'text-yellow-500'}`}>
                          <i className="fas fa-star mr-1"></i>
                          {course.rating || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Analytics Section */}
            <h3 className="text-xl font-bold mt-10 mb-4">Course Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`bg-white p-4 rounded-lg shadow ${darkMode ? 'bg-gray-800' : ''}`}>
                <h4 className="text-lg font-semibold mb-2 text-primary">Enrollment Statistics</h4>
                <ErrorBoundary>
                  <Bar data={analytics.enrollments} />
                </ErrorBoundary>
              </div>
              
              <div className={`bg-white p-4 rounded-lg shadow ${darkMode ? 'bg-gray-800' : ''}`}>
                <h4 className="text-lg font-semibold mb-2 text-primary">Revenue Overview</h4>
                <ErrorBoundary>
                  <Bar data={analytics.revenue} />
                </ErrorBoundary>
              </div>
              
              <div className={`bg-white p-4 rounded-lg shadow ${darkMode ? 'bg-gray-800' : ''}`}>
                <h4 className="text-lg font-semibold mb-2 text-primary">Completion Rates</h4>
                <ErrorBoundary>
                  <Bar data={analytics.completion} />
                </ErrorBoundary>
              </div>
            </div>

            {/* Notifications Section */}
            <h3 className="text-xl font-bold mt-10 mb-4">Notifications</h3>
            <div className={`bg-white p-4 rounded-lg shadow ${darkMode ? 'bg-gray-800' : ''}`}>
              {notifications.length === 0 ? (
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-500'} text-center`}>No notifications yet</p>
              ) : (
                <ul>
                  {notifications.map((notification, index) => (
                    <li 
                      key={index} 
                      className={`flex justify-between items-start p-3 border-b ${darkMode ? 'border-gray-700' : ''} ${
                        notification.read ? darkMode ? 'border-gray-700' : 'border-gray-200' : darkMode ? 'border-blue-600' : 'border-blue-500'
                      }`}
                    >
                      <div>
                        <h5 className={`font-medium mb-1 ${
                          notification.read ? darkMode ? 'text-gray-300' : 'text-gray-600' : darkMode ? 'text-blue-300' : 'text-primary'
                        }`}>
                          {notification.title}
                        </h5>
                        <p className={`${darkMode ? 'text-gray-300' : 'text-gray-500'} text-sm`}>{notification.message}</p>
                        <small className={`${darkMode ? 'text-gray-400' : 'text-gray-400'} mt-1 text-xs`}>
                          {new Date(notification.timestamp?.toDate() || Date.now()).toLocaleString()}
                        </small>
                      </div>
                      <div className="flex space-x-2 mt-2">
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className={`text-blue-500 hover:text-blue-700 text-sm ${darkMode ? 'text-blue-300 hover:text-blue-200' : ''}`}
                          >
                            Mark as read
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteNotification(notification.id)}
                          className={`text-red-500 hover:text-red-700 text-sm ${darkMode ? 'text-red-300 hover:text-red-200' : ''}`}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}