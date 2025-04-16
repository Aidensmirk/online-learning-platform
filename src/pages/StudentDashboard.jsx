import { useState, useEffect } from "react";
import { collection, getDocs, query, where, doc, getDoc, updateDoc, arrayUnion, increment } from "firebase/firestore";
import { db, auth } from "../Services/firebase";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { motion } from "framer-motion";
import NotificationBell from "../components/NotificationBell";

function Navbar({ courses }) {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return unsubscribe;
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <nav className="flex justify-between items-center p-4 bg-primary text-white shadow-md">
      <div className="text-xl font-bold">
        <Link to="/" className="hover:text-accent transition-colors duration-300">
          Student Portal
        </Link>
      </div>
      <div className="flex space-x-6 items-center">
        <Link to="/student-dashboard" className="hover:text-accent transition-colors duration-300">
          Dashboard
        </Link>
        <Link
          to={{
            pathname: "/my-courses",
            state: { enrolledCourses: courses.filter((course) => course.isEnrolled) },
          }}
          className="hover:text-accent transition-colors duration-300"
        >
          My Courses
        </Link>
        <Link to="/profile" className="hover:text-accent transition-colors duration-300">
          Profile
        </Link>
        <Link to="/wishlist" className="hover:text-accent transition-colors duration-300">
          Wishlist
        </Link>
        <NotificationBell />
        {user ? (
          <div className="flex items-center space-x-2">
            <img 
              src={user.photoURL || "https://via.placeholder.com/40"} 
              alt="Profile" 
              className="w-8 h-8 rounded-full" 
            />
            <button 
              onClick={handleSignOut}
              className="hover:text-accent transition-colors duration-300"
            >
              Logout
            </button>
          </div>
        ) : (
          <Link to="/login" className="hover:text-accent transition-colors duration-300">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}

export default function StudentDashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [userStats, setUserStats] = useState({
    enrolledCourses: 0,
    completedCourses: 0,
    totalLearningHours: 0,
  });
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [minRating, setMinRating] = useState(0);
  const [showWishlist, setShowWishlist] = useState(false);
  const [showMyCourses, setShowMyCourses] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  // Get current user
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return unsubscribe;
  }, []);

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const coursesSnapshot = await getDocs(collection(db, "courses"));
        const coursesData = coursesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          isInWishlist: false,
          isEnrolled: false,
        }));
        
        // Get user-specific data
        if (user) {
          const userData = await getDoc(doc(db, "users", user.uid));
          if (userData.exists()) {
            coursesData.forEach(course => {
              course.isInWishlist = userData.data().wishlist?.includes(course.id);
              course.isEnrolled = userData.data().enrolledCourses?.includes(course.id);
            });
          }
        }
        
        setCourses(coursesData);
        setFilteredCourses(coursesData);
      } catch (error) {
        setError("Failed to load courses");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user]);

  // Fetch user statistics
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user) return;
      
      try {
        const userData = await getDoc(doc(db, "users", user.uid));
        if (userData.exists()) {
          setUserStats({
            enrolledCourses: userData.data().enrolledCourses?.length || 0,
            completedCourses: userData.data().completedCourses?.length || 0,
            totalLearningHours: userData.data().totalLearningHours || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching user stats:", error);
      }
    };

    fetchUserStats();
  }, [user]);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const notificationsSnapshot = await getDocs(collection(db, "notifications"));
        const notificationsData = notificationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          read: doc.data().read || false,
        }));
        setNotifications(notificationsData);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();
  }, []);

  // Filter courses
  useEffect(() => {
    const filterCourses = () => {
      let filtered = [...courses];
      
      // Search filter
      if (searchQuery) {
        filtered = filtered.filter(course => 
          course.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Category filter
      if (selectedCategory !== "all") {
        filtered = filtered.filter(course => course.category === selectedCategory);
      }
      
      // Price range filter
      filtered = filtered.filter(course => 
        course.price >= priceRange[0] && course.price <= priceRange[1]
      );
      
      // Rating filter
      filtered = filtered.filter(course => 
        (course.rating || 0) >= minRating
      );
      
      setFilteredCourses(filtered);
    };

    filterCourses();
  }, [searchQuery, selectedCategory, priceRange, minRating, courses]);

  // Handle wishlist toggle
  const toggleWishlist = async (courseId) => {
    if (!user) return;
    
    try {
      const userRef = doc(db, "users", user.uid);
      const userData = await getDoc(userRef);
      
      if (userData.exists()) {
        const wishlist = userData.data().wishlist || [];
        const updatedWishlist = wishlist.includes(courseId) 
          ? wishlist.filter(id => id !== courseId) 
          : [...wishlist, courseId];
        
        await updateDoc(userRef, {
          wishlist: updatedWishlist
        });
        
        // Refresh courses
        const updatedCourses = courses.map(course => {
          if (course.id === courseId) {
            return { ...course, isInWishlist: !course.isInWishlist };
          }
          return course;
        });
        
        setCourses(updatedCourses);
      }
    } catch (error) {
      console.error("Error updating wishlist:", error);
    }
  };

  // Handle course enrollment
  const enrollCourse = async (course) => {
    if (!user) return;
  
    try {
      const userRef = doc(db, "users", user.uid);
      const userData = await getDoc(userRef);
  
      if (userData.exists()) {
        const enrolledCourses = userData.data().enrolledCourses || [];
        const isAlreadyEnrolled = enrolledCourses.includes(course.id);
  
        if (!isAlreadyEnrolled) {
          await updateDoc(userRef, {
            enrolledCourses: arrayUnion(course.id),
            totalLearningHours: increment(course.learningHours || 0),
          });
  
          // Refresh courses
          const updatedCourses = courses.map((c) => {
            if (c.id === course.id) {
              return { ...c, isEnrolled: true };
            }
            return c;
          });
  
          setCourses(updatedCourses);
  
          // Update enrolled courses
          const enrolled = updatedCourses.filter((c) => c.isEnrolled);
          setFilteredCourses(enrolled);
        }
      }
    } catch (error) {
      console.error("Error enrolling course:", error);
    }
  };
  

  const handleMarkAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        read: true
      });
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await deleteDoc(doc(db, "notifications", notificationId));
      
      setNotifications(prev => 
        prev.filter(n => n.id !== notificationId)
      );
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  return (
    <>
      <Navbar courses={courses} />
      
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
        <div className={`min-h-screen ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-800'}`}>
          {/* Welcome Section */}
          <div className="py-24 px-8 bg-gradient-to-r from-primary to-blue-600">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between space-y-8 md:space-y-0">
              <div className="md:w-1/2 text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Welcome to E-Learning
                </h1>
                <p className="text-lg text-white mb-6">
                  Discover a wide range of expertly curated courses to help you learn new skills, grow your career, and achieve your goals.
                </p>
                <div className="flex space-x-4">
                  <Link
                    to="/register"
                    className="bg-white text-primary px-6 py-3 rounded-lg shadow-lg hover:bg-gray-100 transition duration-300"
                  >
                    Get Started
                  </Link>
                  <Link
                    to="/about"
                    className="bg-transparent text-white px-6 py-3 rounded-lg border border-white hover:bg-white hover:text-primary transition duration-300"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
              <div className="md:w-1/2 flex justify-center">
                <motion.img
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  src="src/assets/undraw_programming_65t2.svg"
                  alt="Online Learning"
                  className="w-3/4 max-w-md"
                />
              </div>
            </div>
          </div>

          {/* Dashboard Stats */}
          <div className="py-12 px-8 bg-white">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className={`p-6 rounded-lg shadow ${darkMode ? 'bg-blue-800' : 'bg-blue-100'} text-center`}>
                  <div className="flex justify-center mb-2">
                    <svg className="w-8 h-8 ${darkMode ? 'text-blue-200' : 'text-blue-800'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0-1v-5a6 6 0 00-9-5.198M5.5 11a2.5 2.5 0 100-5 0 2.5 2.5 0 000 5z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold ${darkMode ? 'text-blue-200' : 'text-blue-800'} mb-2">
                    {userStats.enrolledCourses}
                  </h3>
                  <p className="text-gray-600">Enrolled Courses</p>
                </div>
                <div className={`p-6 rounded-lg shadow ${darkMode ? 'bg-green-800' : 'bg-green-100'} text-center`}>
                  <div className="flex justify-center mb-2">
                    <svg className="w-8 h-8 ${darkMode ? 'text-green-200' : 'text-green-800'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold ${darkMode ? 'text-green-200' : 'text-green-800'} mb-2">
                    {userStats.completedCourses}
                  </h3>
                  <p className="text-gray-600">Completed Courses</p>
                </div>
                <div className={`p-6 rounded-lg shadow ${darkMode ? 'bg-purple-800' : 'bg-purple-100'} text-center`}>
                  <div className="flex justify-center mb-2">
                    <svg className="w-8 h-8 ${darkMode ? 'text-purple-200' : 'text-purple-800'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold ${darkMode ? 'text-purple-200' : 'text-purple-800'} mb-2">
                    {userStats.totalLearningHours}h
                  </h3>
                  <p className="text-gray-600">Total Learning Hours</p>
                </div>
              </div>
            </div>
          </div>

          {/* Courses Section */}
          <div className="py-8 px-8">
            <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-2xl p-8">
              <h2 className="text-3xl font-bold mb-6 text-primary text-center">
                Student Dashboard
              </h2>

              {/* Tabs */}
              <div className="mb-6">
                <button
                  onClick={() => setShowMyCourses(false)}
                  className={`px-4 py-2 rounded-lg mr-2 ${!showMyCourses && !showWishlist ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  All Courses
                </button>
                <button
                  onClick={() => setShowMyCourses(true)}
                  className={`px-4 py-2 rounded-lg mr-2 ${showMyCourses ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  My Courses
                </button>
                <button
                  onClick={() => setShowWishlist(true)}
                  className={`px-4 py-2 rounded-lg ${showWishlist ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  Wishlist
                </button>
              </div>

              {/* Search and Filters */}
              <div className="mb-6">
                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full p-3 pl-10 border rounded-lg"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center px-3">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-gray-500">Categories:</span>
                  <button
                    className={`px-3 py-1 rounded ${selectedCategory === "all" ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}
                    onClick={() => setSelectedCategory("all")}
                  >
                    All
                  </button>
                  <button
                    className={`px-3 py-1 rounded ${selectedCategory === "programming" ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}
                    onClick={() => setSelectedCategory("programming")}
                  >
                    Programming
                  </button>
                  <button
                    className={`px-3 py-1 rounded ${selectedCategory === "design" ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}
                    onClick={() => setSelectedCategory("design")}
                  >
                    Design
                  </button>
                  <button
                    className={`px-3 py-1 rounded ${selectedCategory === "business" ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}
                    onClick={() => setSelectedCategory("business")}
                  >
                    Business
                  </button>
                </div>
                
                <div className="flex items-center mb-4">
                  <span className="text-gray-500 mr-4">Price Range:</span>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                    className="w-64"
                  />
                  <span>${priceRange[1]}</span>
                </div>
                
                <div className="flex items-center">
                  <span className="text-gray-500 mr-4">Minimum Rating:</span>
                  <select
                    value={minRating}
                    onChange={(e) => setMinRating(parseInt(e.target.value))}
                    className="border p-2 rounded"
                  >
                    <option value="0">All</option>
                    <option value="3">3 Stars+</option>
                    <option value="4">4 Stars+</option>
                    <option value="4.5">4.5 Stars+</option>
                  </select>
                </div>
              </div>

              {filteredCourses.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                  <div className="text-center">
                    <svg className="w-16 h-16 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m1 3l3-3 8 8M5.347 7.146a.5.5 0 01.646.316l1.5 1.75a.5.5 0 00.646.316H11a.5.5 0 01.316.646l1.75 1.5a.5.5 0 00.316.646l.75.75a.5.5 0 010 .707l-.75.75a.5.5 0 01-.707 0l-.75-.75a.5.5 0 00-.707 0l-.75.75a.5.5 0 01-1 0l-.75-.75a.5.5 0 01-.316-.646H7.35a.5.5 0 01-.316-.646l-1.5-1.75a.5.5 0 00-.646-.316l-1.5-1.75a.5.5 0 01-.316-.646z" />
                    </svg>
                    <p className="text-gray-500 mt-2">No courses found</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {filteredCourses
                    .filter(course => 
                      showMyCourses ? course.isEnrolled : 
                      showWishlist ? course.isInWishlist : true
                    )
                    .map(course => (
                      <motion.div
                        key={course.id}
                        className={`bg-white p-4 rounded-lg shadow hover:shadow-lg transition duration-300 ${darkMode ? 'bg-gray-800' : ''}`}
                        whileHover={{ scale: 1.02 }}
                      >
                        {course.thumbnailURL && (
                          <img
                            src={course.thumbnailURL}
                            alt={course.title}
                            className="h-40 w-full object-cover rounded-md mb-3"
                          />
                        )}
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold text-primary">{course.title}</h3>
                          {course.isEnrolled && (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                              Enrolled
                            </span>
                          )}
                        </div>
                        <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mt-2`}>{course.description}</p>
                        <div className="flex justify-between items-center mt-4">
                          <div>
                            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-500'} text-sm mb-1`}>
                              Price: ${course.price || "Free"}
                            </p>
                            <div className="flex items-center text-yellow-500">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className={i < (course.rating || 0) ? "text-yellow-500" : "text-gray-300"}>
                                  ★
                                </span>
                              ))}
                              <span className="text-gray-500 ml-1">{course.rating || 0}</span>
                            </div>
                          </div>
                          <div className="flex space-x-2 mt-2">
                            {!course.isEnrolled && (
                              <button
                                onClick={() => enrollCourse(course)}
                                className={`bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition duration-300 ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                              >
                                Enroll
                              </button>
                            )}
                            <button
                              onClick={() => toggleWishlist(course.id)}
                              className={`px-4 py-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} text-gray-700 hover:bg-gray-300 transition duration-300`}
                            >
                              {course.isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Notifications Section */}
          <div className="py-12 px-8 bg-white">
            <div className="max-w-6xl mx-auto">
              <h3 className="text-xl font-bold mb-6 text-primary">Notifications</h3>
              <div className={`bg-gray-100 p-4 rounded-lg ${darkMode ? 'bg-gray-800' : ''}`}>
                {notifications.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v12a2 2 0 01-2 2zM7 8h10M7 12h4M7 16h5" />
                    </svg>
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  <ul>
                    {notifications.map((notification, index) => (
                      <motion.li
                        key={index}
                        className={`flex justify-between items-start p-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} ${notification.read ? darkMode ? 'bg-gray-800' : 'bg-gray-100' : darkMode ? 'bg-gray-700' : 'bg-white'} rounded-lg mb-2`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div>
                          <h4 className={`font-medium mb-1 ${notification.read ? darkMode ? 'text-gray-300' : 'text-gray-500' : darkMode ? 'text-blue-300' : 'text-primary'}`}>
                            {notification.title}
                          </h4>
                          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-sm mb-2`}>
                            {notification.message}
                          </p>
                          <small className={`${darkMode ? 'text-gray-400' : 'text-gray-400'} text-xs`}>
                            {new Date(notification.timestamp?.toDate() || Date.now()).toLocaleString()}
                          </small>
                        </div>
                        <div className="flex space-x-2 mt-2">
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className={`text-blue-500 hover:text-blue-700 ${darkMode ? 'text-blue-300 hover:text-blue-200' : ''}`}
                            >
                              Mark as read
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteNotification(notification.id)}
                            className={`text-red-500 hover:text-red-700 ${darkMode ? 'text-red-300 hover:text-red-200' : ''}`}
                          >
                            Delete
                          </button>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}