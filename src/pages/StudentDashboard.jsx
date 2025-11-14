import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import { coursesAPI, enrollmentsAPI, wishlistAPI } from "../Services/api";
import { getCurrentUser } from "../Services/authService";
import PageLayout from "../components/PageLayout";
import { useTheme } from "../context/ThemeContext";

export default function StudentDashboard() {
  const { darkMode } = useTheme();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [userStats, setUserStats] = useState({
    enrolledCourses: 0,
    completedCourses: 0,
    totalLearningHours: 0,
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceCeiling, setPriceCeiling] = useState(1000);
  const [minRating, setMinRating] = useState(0);
  const [showMyCourses, setShowMyCourses] = useState(false);
  const [showWishlist, setShowWishlist] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        setUser(null);
      }
    };
    bootstrap();
  }, []);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        const rawCourses = await coursesAPI.getAll();
        const list = Array.isArray(rawCourses) ? rawCourses : rawCourses.results || [];

        let enrollments = [];
        let wishlist = [];
        if (user) {
          try {
            const enrollmentsData = await enrollmentsAPI.getAll();
            enrollments = Array.isArray(enrollmentsData) ? enrollmentsData : enrollmentsData.results || [];
          } catch (err) {
            console.warn("Unable to load enrollments", err);
          }
          try {
            const wishlistData = await wishlistAPI.getAll();
            wishlist = Array.isArray(wishlistData) ? wishlistData : wishlistData.results || [];
          } catch (err) {
            console.warn("Unable to load wishlist", err);
          }
        }

        const decorated = list.map((course) => ({
          ...course,
          isEnrolled: enrollments.some(
            (enrollment) =>
              enrollment.course?.id === course.id || enrollment.course === course.id
          ),
          isInWishlist: wishlist.some(
            (item) => item.course?.id === course.id || item.course === course.id
          ),
        }));

        setCourses(decorated);
        setFilteredCourses(decorated);
      } catch (err) {
        console.error("Failed to load courses", err);
        setError("We couldn’t load courses right now. Please try again shortly.");
      } finally {
        setLoading(false);
      }
    };

    if (user !== undefined) {
      loadCourses();
    }
  }, [user]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        const enrollmentsData = await enrollmentsAPI.getAll();
        const enrollments = Array.isArray(enrollmentsData)
          ? enrollmentsData
          : enrollmentsData.results || [];
        setUserStats({
          enrolledCourses: enrollments.length,
          completedCourses: enrollments.filter((enrollment) => enrollment.progress >= 100).length,
          totalLearningHours: 0,
        });
      } catch (err) {
        console.warn("Unable to load stats", err);
      }
    };
    fetchStats();
  }, [user]);

  useEffect(() => {
    let result = [...courses];

    if (searchQuery.trim()) {
      result = result.filter((course) =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      result = result.filter((course) => course.category === selectedCategory);
    }

    result = result.filter(
      (course) => Number(course.price || 0) <= priceCeiling && (course.rating || 0) >= minRating
    );

    setFilteredCourses(result);
  }, [courses, searchQuery, selectedCategory, priceCeiling, minRating]);

  const wishlistCount = useMemo(
    () => courses.filter((course) => course.isInWishlist).length,
    [courses]
  );

  const greetingName = user?.display_name || user?.username;
  const greetingTitle = greetingName ? `Welcome back, ${greetingName}` : "Welcome back";
  const subtitleText = user
    ? "Review your learning progress, jump back into ongoing courses, and discover what’s next."
    : "Sign in to curate your learning journey and track your achievements across the platform.";

  const statHighlights = [
    {
      key: "enrolled",
      label: "Enrolled courses",
      value: userStats.enrolledCourses,
      hint: "Active classes in your queue",
      variant: "mint",
      icon: (
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
    {
      key: "completed",
      label: "Courses completed",
      value: userStats.completedCourses,
      hint: "Milestones already achieved",
      variant: "amber",
      icon: (
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      key: "wishlist",
      label: "Wishlist saved",
      value: wishlistCount,
      hint: "Courses bookmarked for later",
      variant: "indigo",
      icon: (
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      ),
    },
  ];

  const toggleWishlist = async (courseId) => {
    if (!user) return;
    try {
      const target = courses.find((course) => course.id === courseId);
      if (target?.isInWishlist) {
        await coursesAPI.removeFromWishlist(courseId);
      } else {
        await coursesAPI.addToWishlist(courseId);
      }
      setCourses((prev) =>
        prev.map((course) =>
          course.id === courseId ? { ...course, isInWishlist: !course.isInWishlist } : course
        )
      );
    } catch (err) {
      console.error("Unable to update wishlist", err);
    }
  };

  const enrollCourse = async (course) => {
    if (!user) return;
    try {
      await coursesAPI.enroll(course.id);
      setCourses((prev) =>
        prev.map((c) => (c.id === course.id ? { ...c, isEnrolled: true } : c))
      );
      setUserStats((prev) => ({
        ...prev,
        enrolledCourses: prev.enrolledCourses + 1,
      }));
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message === "Already enrolled") {
        setCourses((prev) =>
          prev.map((c) => (c.id === course.id ? { ...c, isEnrolled: true } : c))
        );
      } else {
        console.error("Enrollment failed", err);
      }
    }
  };

  const handleMarkAsRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId ? { ...notification, read: true } : notification
      )
    );
  };

  const handleDeleteNotification = (notificationId) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== notificationId));
  };

  const handleViewAll = () => {
    setShowMyCourses(false);
    setShowWishlist(false);
  };

  const filterButtonClass = (isActive) =>
    `px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
      isActive
        ? "bg-primary text-white border-transparent shadow-lg shadow-primary/30"
        : "bg-transparent text-gray-500 border-gray-300 hover:bg-gray-100 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-800"
    }`;

  const displayCourses = useMemo(
    () =>
      filteredCourses.filter((course) =>
        showMyCourses ? course.isEnrolled : showWishlist ? course.isInWishlist : true
      ),
    [filteredCourses, showMyCourses, showWishlist]
  );

  return (
    <PageLayout
      eyebrow="Student workspace"
      title={greetingTitle}
      subtitle={subtitleText}
      actions={
        user && (
          <>
            <button
              type="button"
              onClick={handleViewAll}
              className={filterButtonClass(!showMyCourses && !showWishlist)}
            >
              All courses
            </button>
            <button
              type="button"
              onClick={() => {
                setShowMyCourses(true);
                setShowWishlist(false);
              }}
              className={filterButtonClass(showMyCourses)}
            >
              My courses
            </button>
            <button
              type="button"
              onClick={() => {
                setShowWishlist(true);
                setShowMyCourses(false);
              }}
              className={filterButtonClass(showWishlist)}
            >
              Wishlist
            </button>
          </>
        )
      }
    >
      {error && (
        <div className="panel panel--soft border border-red-200/70 text-red-600 dark:border-red-400/30 dark:text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="loader border-t-4 border-primary rounded-full w-12 h-12 animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-12">
          <div className="panel-grid panel-grid--cols-3">
            {statHighlights.map((stat) => (
              <div key={stat.key} className={`stat-card stat-card--${stat.variant}`}>
                <div className="stat-card__icon">{stat.icon}</div>
                <h3>{stat.value}</h3>
                <span>{stat.label}</span>
                <p>{stat.hint}</p>
              </div>
            ))}
          </div>

          <div className="panel panel--soft">
            <div className="flex flex-col gap-6">
              <div className="glass-input relative">
                <input
                  type="text"
                  placeholder="Search for courses, instructors, or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent px-12 py-3 text-base text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none"
                />
                <div className="absolute inset-y-0 left-0 flex items-center px-4 text-gray-400 dark:text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="chip">Categories</span>
                {["all", "programming", "design", "business", "marketing"].map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1.5 rounded-full text-sm font-semibold transition ${
                      selectedCategory === category
                        ? "bg-primary text-white shadow shadow-primary/30"
                        : "bg-gray-200 text-gray-600 hover:bg-gray-200/75 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    {category === "all" ? "All" : category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Price Range</span>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    value={priceCeiling}
                    onChange={(e) => setPriceCeiling(parseInt(e.target.value, 10))}
                    className="w-full accent-primary"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">${priceCeiling}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Minimum rating</span>
                  <select
                    value={minRating}
                    onChange={(e) => setMinRating(parseFloat(e.target.value))}
                    className="glass-input px-3 py-2 bg-transparent border-none text-sm text-gray-700 dark:text-gray-200"
                  >
                    <option value="0">All ratings</option>
                    <option value="3">3 ★ & up</option>
                    <option value="4">4 ★ & up</option>
                    <option value="4.5">4.5 ★ & up</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Courses for you</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Continue where you left off or explore something new.
                </p>
              </div>
              {(showMyCourses || showWishlist) && <span className="chip chip--success">Filtered view</span>}
            </div>

            {displayCourses.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-16 text-center text-gray-500 dark:text-gray-300">
                <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No courses match your filters right now. Try adjusting your preferences.</p>
              </div>
            ) : (
              <div className="panel-grid panel-grid--cols-3">
                {displayCourses.map((course) => (
                  <motion.div
                    key={course.id}
                    whileHover={{ y: -6 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  >
                    <div className="course-card">
                      <div className="course-card__thumb">
                        {course.thumbnail ? (
                          <img
                            src={
                              course.thumbnail.startsWith("http")
                                ? course.thumbnail
                                : `http://localhost:8000${course.thumbnail}`
                            }
                            alt={course.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-400 text-sm">
                            No thumbnail
                          </div>
                        )}
                      </div>
                      <div className="course-card__meta">
                        <span className="font-semibold text-slate-700 dark:text-slate-100">
                          {course.category || "General"}
                        </span>
                        <span>{course.duration_minutes ? `${course.duration_minutes} mins` : "Self-paced"}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{course.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">{course.description}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1 text-yellow-500">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={i < (course.rating || 0) ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}
                            >
                              ★
                            </span>
                          ))}
                          <span className="ml-1 text-gray-500 dark:text-gray-300">{course.rating || "New"}</span>
                        </div>
                        <span className="font-semibold text-slate-700 dark:text-slate-100">
                          {course.price ? `$${course.price}` : "Free"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {course.isEnrolled ? (
                          <>
                            <Link
                              to={`/course-player/${course.id}`}
                              className="flex-1 min-w-[120px] rounded-full bg-primary px-4 py-2 text-center text-white font-semibold shadow-sm hover:bg-primary-hover transition"
                            >
                              Continue
                            </Link>
                            <Link
                              to={`/course-details/${course.id}`}
                              className="flex-1 min-w-[120px] rounded-full border border-primary px-4 py-2 text-center text-primary hover:bg-primary/10 transition dark:text-green-200 dark:border-green-300 dark:hover:bg-green-300/10"
                            >
                              Overview
                            </Link>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => enrollCourse(course)}
                              className="flex-1 min-w-[120px] rounded-full bg-primary px-4 py-2 text-center text-white font-semibold shadow-sm hover:bg-primary-hover transition"
                            >
                              Enroll
                            </button>
                            <Link
                              to={`/course-details/${course.id}`}
                              className="flex-1 min-w-[120px] rounded-full border border-primary px-4 py-2 text-center text-primary hover:bg-primary/10 transition dark:text-green-200 dark:border-green-300 dark:hover:bg-green-300/10"
                            >
                              Details
                            </Link>
                          </>
                        )}
                        <button
                          onClick={() => toggleWishlist(course.id)}
                          className={`px-4 py-2 rounded-full border transition ${
                            course.isInWishlist
                              ? "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                              : "border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                          }`}
                        >
                          {course.isInWishlist ? "Saved" : "Save"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div className="panel panel--soft">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Notifications</h3>
              <span className="chip">{notifications.length ? `${notifications.length} updates` : "Up to date"}</span>
            </div>
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-12 text-center text-gray-500 dark:text-gray-300">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No notifications just yet. New course updates will appear here.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {notifications.map((notification, index) => (
                  <motion.li
                    key={notification.id || index}
                    className={`panel ${notification.read ? "opacity-80" : ""}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.05 }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4
                          className={`text-sm font-semibold ${
                            notification.read ? "text-gray-500 dark:text-gray-400" : "text-primary dark:text-emerald-300"
                          }`}
                        >
                          {notification.title}
                        </h4>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{notification.message}</p>
                        <small className="text-xs text-gray-400 dark:text-gray-500">
                          {notification.timestamp ? new Date(notification.timestamp).toLocaleString() : "Just now"}
                        </small>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/15 dark:text-emerald-200 dark:bg-emerald-500/15"
                          >
                            Mark read
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteNotification(notification.id)}
                          className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-500 hover:bg-red-500/20 dark:text-red-300"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </PageLayout>
  );
}

