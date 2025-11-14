import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getCurrentUser, updateUserProfile } from "../Services/authService";
import { enrollmentsAPI, API_ORIGIN } from "../Services/api";

const resolveMediaUrl = (url) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  return `${API_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
};

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [profileForm, setProfileForm] = useState({ display_name: "", bio: "" });
  const [profilePicture, setProfilePicture] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [enrollments, setEnrollments] = useState([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoadingUser(true);
        const current = await getCurrentUser();
        setUser(current);
        setProfileForm({
          display_name: current.display_name || "",
          bio: current.bio || "",
        });
      } catch (err) {
        navigate("/login");
      } finally {
        setLoadingUser(false);
      }
    };
    loadUser();
  }, [navigate]);

  useEffect(() => {
    const loadEnrollments = async () => {
      if (!user) return;
      try {
        setLoadingEnrollments(true);
        const response = await enrollmentsAPI.getAll();
        const list = Array.isArray(response) ? response : response.results || [];
        setEnrollments(list);
      } catch (err) {
        console.error("Error fetching enrollments", err);
      } finally {
        setLoadingEnrollments(false);
      }
    };
    loadEnrollments();
  }, [user]);

  const handleChange = (field, value) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const payload = {
        display_name: profileForm.display_name,
        bio: profileForm.bio,
      };
      if (profilePicture) {
        payload.profile_picture = profilePicture;
      }
      const updated = await updateUserProfile(payload);
      setUser(updated);
      setProfileForm({
        display_name: updated.display_name || "",
        bio: updated.bio || "",
      });
      setProfilePicture(null);
      setMessage("Profile updated successfully.");
    } catch (err) {
      console.error("Failed to update profile", err);
      const detail =
        err.response?.data?.detail ||
        err.response?.data?.bio?.[0] ||
        err.response?.data?.display_name?.[0] ||
        err.message ||
        "Unable to update profile.";
      setError(detail);
    } finally {
      setSaving(false);
    }
  };

  const enrolledCourses = useMemo(() => {
    return enrollments
      .map((enrollment) => enrollment.course)
      .filter(Boolean);
  }, [enrollments]);

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Navbar />
        <div className="loader border-t-4 border-primary rounded-full w-12 h-12 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 p-6 md:p-10">
        <div className="max-w-5xl mx-auto space-y-8">
          <section className="bg-white shadow-xl rounded-2xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {user.profile_picture ? (
                    <img
                      src={resolveMediaUrl(user.profile_picture)}
                      alt={user.display_name || user.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-semibold text-primary uppercase">
                      {user.display_name?.[0] || user.username?.[0] || "U"}
                    </span>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-primary">
                    {user.display_name || user.username}
                  </h1>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <p className="text-xs text-gray-400 capitalize">
                    {user.role} • Joined {new Date(user.date_joined).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-100 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              {message && (
                <div className="bg-green-100 text-green-600 px-4 py-3 rounded-lg text-sm">
                  {message}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={profileForm.display_name}
                  onChange={(e) => handleChange("display_name", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Your display name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Bio
                </label>
                <textarea
                  value={profileForm.bio}
                  onChange={(e) => handleChange("bio", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px]"
                  placeholder="Tell learners about yourself. This appears on your profile and courses."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Profile Picture
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProfilePicture(e.target.files?.[0] || null)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition disabled:opacity-60"
              >
                {saving ? "Updating..." : "Update Profile"}
              </button>
            </form>
          </section>

          <section className="bg-white shadow-xl rounded-2xl p-6 md:p-8">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-primary">Enrolled Courses</h2>
                <p className="text-sm text-gray-500">Track your learning progress across all courses.</p>
              </div>
              <Link
                to="/all-courses"
                className="text-primary font-medium hover:text-primary/70"
              >
                Explore more courses →
              </Link>
            </div>

            {loadingEnrollments ? (
              <div className="flex justify-center items-center py-8">
                <div className="loader border-t-4 border-primary rounded-full w-12 h-12 animate-spin" />
              </div>
            ) : enrolledCourses.length === 0 ? (
              <div className="border border-dashed border-gray-300 rounded-lg py-12 text-center text-gray-500">
                You are not enrolled in any courses yet. Start learning today!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrolledCourses.map((course) => {
                  const thumbnail = resolveMediaUrl(course.thumbnail);
                  return (
                    <div
                      key={course.id}
                      className="bg-gray-50 border border-gray-200 rounded-xl p-5 flex flex-col gap-3 hover:shadow-lg transition"
                    >
                      {thumbnail && (
                        <img
                          src={thumbnail}
                          alt={course.title}
                          className="h-36 w-full object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1 space-y-2">
                        <h3 className="text-lg font-semibold text-primary">{course.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-3">{course.description}</p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Category: {course.category || "General"}</span>
                        <span>
                          {course.modules?.length || 0} module{(course.modules?.length || 0) === 1 ? "" : "s"}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          to={`/course-player/${course.id}`}
                          className="flex-1 bg-primary text-white text-center py-2 rounded-lg font-semibold hover:bg-primary-dark transition"
                        >
                          Continue
                        </Link>
                        <Link
                          to={`/course-details/${course.id}`}
                          className="flex-1 border border-primary text-primary text-center py-2 rounded-lg font-semibold hover:bg-primary/10 transition"
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}