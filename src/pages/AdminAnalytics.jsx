import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { analyticsAPI } from "../Services/api";
import { useTheme } from "../context/ThemeContext";

const SummaryCard = ({ title, value, accent, darkMode }) => (
  <div
    className={`p-4 rounded-lg text-center shadow ${
      darkMode ? "bg-gray-900 text-white border border-gray-700" : accent
    }`}
  >
    <h4 className="text-lg font-semibold">{title}</h4>
    <p className="text-2xl font-bold mt-2">{value}</p>
  </div>
);

export default function AdminAnalytics() {
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);
  const [categoryStats, setCategoryStats] = useState([]);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const data = await analyticsAPI.getAdminSummary();
        setSummary(data.summary || null);
        setCategoryStats(Array.isArray(data.category_breakdown) ? data.category_breakdown : []);
      } catch (err) {
        console.error("Failed to load admin analytics", err);
        const message =
          err.response?.data?.detail ||
          err.message ||
          "Unable to load analytics right now.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, []);

  const tiles = useMemo(() => {
    if (!summary) return [];
    return [
      { title: "Total Users", value: summary.total_users ?? 0, accent: "bg-blue-100 text-blue-700" },
      { title: "Students", value: summary.total_students ?? 0, accent: "bg-teal-100 text-teal-700" },
      { title: "Instructors/Admins", value: summary.total_instructors ?? 0, accent: "bg-purple-100 text-purple-700" },
      { title: "Courses", value: summary.total_courses ?? 0, accent: "bg-green-100 text-green-700" },
      { title: "Enrollments", value: summary.total_enrollments ?? 0, accent: "bg-amber-100 text-amber-700" },
      { title: "Assignment Submissions", value: summary.total_assignment_submissions ?? 0, accent: "bg-indigo-100 text-indigo-700" },
      { title: "Quiz Submissions", value: summary.total_quiz_submissions ?? 0, accent: "bg-rose-100 text-rose-700" },
      { title: "Estimated Revenue", value: `$${(summary.estimated_revenue ?? 0).toFixed(2)}`, accent: "bg-emerald-100 text-emerald-700" },
    ];
  }, [summary]);

  return (
    <>
      <Navbar />
      <div className={`min-h-screen p-6 md:p-10 transition-colors ${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"}`}>
        <div className={`max-w-7xl mx-auto shadow-xl rounded-2xl p-6 md:p-8 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-primary">Admin Analytics</h1>
              <p className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Platform-wide metrics to help you track growth and engagement.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-100 text-red-600 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="loader border-t-4 border-primary rounded-full w-12 h-12 animate-spin" />
            </div>
          ) : !summary ? (
            <div className="border border-dashed border-gray-300 rounded-lg py-12 text-center text-gray-500">
              Analytics are currently unavailable.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {tiles.map((tile) => (
                  <SummaryCard
                    key={tile.title}
                    title={tile.title}
                    value={tile.value}
                    accent={tile.accent}
                    darkMode={darkMode}
                  />
                ))}
              </div>

              <section className="mt-8 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-primary">Category Breakdown</h2>
                  <span className="text-xs text-gray-500">
                    Top categories by courses and enrollments
                  </span>
                </div>

                {categoryStats.length === 0 ? (
                  <p className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    No category data available yet. Publish courses with categories to see trends.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className={`min-w-full border rounded-lg ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                      <thead className={darkMode ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-600"}>
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Category</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">Courses</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">Enrollments</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryStats.map((item, index) => (
                          <tr
                            key={`${item.category || "uncategorized"}-${index}`}
                            className={`${darkMode ? "border-b border-gray-700" : "border-b border-gray-100"} hover:bg-primary/5 transition`}
                          >
                            <td className="px-4 py-3 text-sm font-medium text-primary">
                              {item.category || "Uncategorized"}
                            </td>
                            <td className="px-4 py-3 text-sm text-right">{item.course_count}</td>
                            <td className="px-4 py-3 text-sm text-right">{item.enrollments}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </>
  );
}

