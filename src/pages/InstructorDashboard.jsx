import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import ErrorBoundary from "../components/ErrorBoundary";
import {
  coursesAPI,
  modulesAPI,
  analyticsAPI,
} from "../Services/api";
import { getCurrentUser } from "../Services/authService";
import { useTheme } from "../context/ThemeContext";
import PageLayout from "../components/PageLayout";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function InstructorDashboard() {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [modulesByCourse, setModulesByCourse] = useState({});
  const [analyticsSummary, setAnalyticsSummary] = useState(null);
  const [analyticsCourses, setAnalyticsCourses] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");

  const summary = useMemo(() => {
    const totalCourses = analyticsSummary?.total_courses ?? courses.length;
    const totalModules = Object.values(modulesByCourse).reduce((sum, list) => sum + list.length, 0);
    const totalLessons = Object.values(modulesByCourse).reduce(
      (sum, list) => sum + list.reduce((acc, module) => acc + (module.lessons?.length || 0), 0),
      0
    );
    return {
      totalCourses,
      totalModules,
      totalLessons,
      totalEnrollments: analyticsSummary?.total_enrollments ?? 0,
      totalRevenue: analyticsSummary?.total_revenue ?? 0,
      averageCompletionRate: analyticsSummary?.average_completion_rate ?? 0,
    };
  }, [courses, modulesByCourse, analyticsSummary]);

  const summaryCards = useMemo(
    () => [
      {
        key: "courses",
        title: "Courses",
        value: summary.totalCourses,
        hint: "Published & draft",
        variant: "mint",
        icon: (
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3h8v4m-9 4h10M5 17h14" />
          </svg>
        ),
      },
      {
        key: "modules",
        title: "Modules",
        value: summary.totalModules,
        hint: "Across all courses",
        variant: "amber",
        icon: (
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8h18M3 16h18M4 12h16" />
          </svg>
        ),
      },
      {
        key: "lessons",
        title: "Lessons",
        value: summary.totalLessons,
        hint: "Ready to teach",
        variant: "indigo",
        icon: (
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h10" />
          </svg>
        ),
      },
      {
        key: "enrollments",
        title: "Enrollments",
        value: summary.totalEnrollments,
        hint: "Students engaged",
        variant: "mint",
        icon: (
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6a4 4 0 110 8m0 0a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ),
      },
      {
        key: "completion",
        title: "Completion rate",
        value: `${summary.averageCompletionRate.toFixed(1)}%`,
        hint: "Average progress",
        variant: "amber",
        icon: (
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      {
        key: "revenue",
        title: "Revenue",
        value: `$${summary.totalRevenue.toFixed(2)}`,
        hint: "Lifetime earnings",
        variant: "indigo",
        icon: (
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V6m0 12v-2" />
          </svg>
        ),
      },
    ],
    [summary]
  );

  const quickActions = useMemo(
    () => [
      {
        key: "manage",
        title: "Manage courses",
        description: "Edit modules, lessons, assignments, and quizzes.",
        action: () => navigate("/manage-courses"),
      },
      {
        key: "create",
        title: "Create course",
        description: "Start a brand new learning experience from scratch.",
        action: () => navigate("/create-course"),
      },
      {
        key: "profile",
        title: "Profile & settings",
        description: "Refresh your instructor bio and platform presence.",
        action: () => navigate("/profile"),
      },
    ],
    [navigate]
  );

  const analyticsData = useMemo(() => {
    const labels = courses.map((course) => course.title);
    const moduleCounts = courses.map((course) => modulesByCourse[course.id]?.length || 0);
    const lessonCounts = courses.map((course) =>
      (modulesByCourse[course.id] || []).reduce((acc, module) => acc + (module.lessons?.length || 0), 0)
    );

    return {
      modulesChart: {
        labels,
        datasets: [
          {
            label: "Modules",
            data: moduleCounts,
            backgroundColor: "rgba(59, 130, 246, 0.6)",
          },
        ],
      },
      lessonsChart: {
        labels,
        datasets: [
          {
            label: "Lessons",
            data: lessonCounts,
            backgroundColor: "rgba(16, 185, 129, 0.6)",
          },
        ],
      },
    };
  }, [courses, modulesByCourse]);

  const ensureUser = async () => {
    const stored = JSON.parse(localStorage.getItem("user") || "null");
    if (stored) {
      setUser(stored);
      return stored;
    }
    try {
      const current = await getCurrentUser();
      setUser(current);
      return current;
    } catch (err) {
      navigate("/login");
      throw err;
    }
  };

  const loadCourses = async (currentUser) => {
    const response = await coursesAPI.getAll();
    const list = Array.isArray(response) ? response : response.results || [];
    const instructorCourses = list.filter(
      (course) => course.instructor?.id === currentUser.id || currentUser.role === "admin"
    );
    setCourses(instructorCourses);

    const moduleMap = {};
    await Promise.all(
      instructorCourses.map(async (course) => {
        try {
          const data = await modulesAPI.list({ course: course.id });
          const moduleList = Array.isArray(data) ? data : data.results || [];
          moduleMap[course.id] = moduleList;
        } catch (err) {
          moduleMap[course.id] = [];
        }
      })
    );
    setModulesByCourse(moduleMap);
  };

  const loadAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const data = await analyticsAPI.getInstructorSummary();
      setAnalyticsSummary(data.summary || null);
      setAnalyticsCourses(Array.isArray(data.courses) ? data.courses : []);
      setAnalyticsError("");
    } catch (err) {
      console.error("Failed to load analytics", err);
      const message =
        err.response?.data?.detail ||
        err.message ||
        "Unable to load analytics right now.";
      setAnalyticsError(message);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const currentUser = await ensureUser();
        if (!currentUser) return;
        if (currentUser.role !== "instructor" && currentUser.role !== "admin") {
          navigate("/");
          return;
        }
        await loadCourses(currentUser);
        await loadAnalytics();
      } catch (err) {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader border-t-4 border-primary rounded-full w-12 h-12 animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="max-w-3xl mx-auto mt-10 bg-red-100 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <PageLayout
        eyebrow="Instructor hub"
        title="Loading your workspace"
        subtitle="We’re preparing your analytics and course data."
      >
        <div className="flex justify-center items-center py-24">
          <div className="loader border-t-4 border-primary rounded-full w-12 h-12 animate-spin" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      eyebrow="Instructor hub"
      title={`Welcome back${user ? `, ${user.display_name || user.username}` : ""}!`}
      subtitle="Manage your courses, track performance trends, and keep learners engaged."
      actions={
        <button
          onClick={toggleDarkMode}
          className="px-4 py-2 rounded-full text-sm font-semibold bg-primary text-white hover:bg-primary-dark transition"
        >
          {darkMode ? "Light mode" : "Dark mode"}
        </button>
      }
    >
      {error && (
        <div className="panel panel--soft border border-red-200/70 text-red-600 dark:border-red-400/30 dark:text-red-300 mb-6">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-12">
        <div className="panel-grid panel-grid--cols-3">
          {summaryCards.map((card) => (
            <SummaryCard key={card.key} {...card} />
          ))}
        </div>

        <div className="panel-grid panel-grid--cols-3">
          {quickActions.map((action) => (
            <QuickAction key={action.key} {...action} />
          ))}
        </div>

        <section className="panel panel--soft space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-semibold text-primary">Your courses</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Showing {courses.length} course{courses.length === 1 ? "" : "s"}
            </span>
          </div>
          {courses.length === 0 ? (
            <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center text-gray-500 dark:text-gray-400">
              You haven’t published any courses yet. Start by creating a new course.
            </div>
          ) : (
            <div className="panel-grid panel-grid--cols-2">
              {courses.map((course) => {
                const modules = modulesByCourse[course.id] || [];
                const lessons = modules.reduce(
                  (acc, module) => acc + (module.lessons?.length || 0),
                  0
                );
                return (
                  <article key={course.id} className="panel">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-xl font-semibold text-primary">{course.title}</h4>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                          {course.description}
                        </p>
                      </div>
                      <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                        {course.status?.charAt(0).toUpperCase() + course.status?.slice(1) || "Draft"}
                      </span>
                    </div>
                    <dl className="mt-4 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <dt className="font-medium text-gray-500 dark:text-gray-400">Modules</dt>
                        <dd className="text-lg font-semibold text-gray-800 dark:text-white">{modules.length}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-500 dark:text-gray-400">Lessons</dt>
                        <dd className="text-lg font-semibold text-gray-800 dark:text-white">{lessons}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-500 dark:text-gray-400">Price</dt>
                        <dd className="text-lg font-semibold text-gray-800 dark:text-white">${course.price || 0}</dd>
                      </div>
                    </dl>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        to={`/course-details/${course.id}`}
                        className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition"
                      >
                        View details
                      </Link>
                      <Link
                        to="/manage-courses"
                        state={{ courseId: course.id }}
                        className="rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10 transition"
                      >
                        Manage content
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="panel panel--soft space-y-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-semibold text-primary">Performance overview</h3>
            {analyticsError && <span className="text-xs text-red-500">{analyticsError}</span>}
          </div>

          {analyticsLoading ? (
            <div className="flex justify-center py-6">
              <div className="loader border-t-4 border-primary rounded-full w-12 h-12 animate-spin" />
            </div>
          ) : analyticsCourses.length === 0 ? (
            <div className="border border-dashed border-gray-300 rounded-lg py-12 text-center text-gray-500 dark:text-gray-400">
              Analytics will appear once you have published courses and student activity.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className={`min-w-full border rounded-lg ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                <thead className={darkMode ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-600"}>
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Course</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Enrollments</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Completion</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Avg quiz</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Assignments</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Revenue</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsCourses.map((course) => (
                    <tr
                      key={`analytics-${course.id}`}
                      className={`${darkMode ? "border-b border-gray-700" : "border-b border-gray-100"} hover:bg-primary/5 transition`}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-primary">{course.title}</td>
                      <td className="px-4 py-3 text-xs">
                        <span
                          className={`px-2 py-1 rounded-full ${
                            course.status === "published"
                              ? "bg-green-500/10 text-green-600"
                              : course.status === "draft"
                              ? "bg-yellow-500/10 text-yellow-600"
                              : "bg-gray-500/10 text-gray-500"
                          }`}
                        >
                          {course.status?.charAt(0).toUpperCase() + course.status?.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">{course.enrollments}</td>
                      <td className="px-4 py-3 text-sm text-right">{course.completion_rate}%</td>
                      <td className="px-4 py-3 text-sm text-right">{course.average_quiz_score}%</td>
                      <td className="px-4 py-3 text-sm text-right">{course.assignment_submissions}</td>
                      <td className="px-4 py-3 text-sm text-right">${course.revenue.toFixed(2)}</td>
                      <td className="px-4 py-3 text-xs text-right text-gray-500">
                        {course.updated_at ? new Date(course.updated_at).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel panel--soft space-y-6">
          <h3 className="text-xl font-semibold text-primary">Course analytics</h3>
          {courses.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Analytics will appear once you have at least one course.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} rounded-xl p-4 shadow`}>
                <h4 className="font-semibold mb-2 text-primary">Modules per course</h4>
                <ErrorBoundary>
                  <Bar data={analyticsData.modulesChart} />
                </ErrorBoundary>
              </div>
              <div className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} rounded-xl p-4 shadow`}>
                <h4 className="font-semibold mb-2 text-primary">Lessons per course</h4>
                <ErrorBoundary>
                  <Bar data={analyticsData.lessonsChart} />
                </ErrorBoundary>
              </div>
            </div>
          )}
        </section>

        <section className="panel panel--soft">
          <h3 className="text-xl font-semibold text-primary mb-2">Notifications</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Notifications and messaging will appear here once configured. Stay tuned!
          </p>
        </section>
      </div>
    </PageLayout>
  );
}

const SummaryCard = ({ title, value, hint, icon, variant }) => (
  <div className={`stat-card stat-card--${variant}`}>
    <div className="stat-card__icon">{icon}</div>
    <h3>{value}</h3>
    <span>{title}</span>
    <p>{hint}</p>
  </div>
);

const QuickAction = ({ title, description, action }) => (
  <div className="panel panel--soft flex flex-col gap-3">
    <h4 className="text-lg font-semibold text-primary">{title}</h4>
    <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
    <button
      onClick={action}
      className="mt-auto self-start rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition"
    >
      Open
    </button>
  </div>
);