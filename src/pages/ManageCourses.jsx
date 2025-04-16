import { useEffect, useState } from "react";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db, auth } from "../Services/firebase";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { onAuthStateChanged } from "firebase/auth";

export default function ManageCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  const fetchCourses = async () => {
    try {
      if (!auth.currentUser) {
        console.error("User is not authenticated.");
        return;
      }

      const q = query(
        collection(db, "courses"),
        where("instructorId", "==", auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const coursesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      let sortedCourses = [...coursesData];
      if (sortOption === "newest") {
        sortedCourses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else if (sortOption === "oldest") {
        sortedCourses.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      } else if (sortOption === "title") {
        sortedCourses.sort((a, b) => a.title.localeCompare(b.title));
      }

      setCourses(sortedCourses);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchCourses();
      } else {
        console.error("User is not authenticated.");
        navigate("/login");
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [sortOption]);

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      try {
        await deleteDoc(doc(db, "courses", courseId));
        setCourses(courses.filter((course) => course.id !== courseId));
      } catch (error) {
        console.error("Error deleting course:", error);
        alert("Failed to delete course. Please try again.");
      }
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="loader border-t-4 border-primary rounded-full w-12 h-12 animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <Navbar className="bg-primary text-white shadow-md" />

      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-2xl p-8">
          <button
            onClick={() => navigate("/instructor-dashboard")}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition mb-6"
          >
            ← Back to Dashboard
          </button>
          <h2 className="text-3xl font-bold mb-6 text-primary text-center">Manage Your Courses</h2>
          
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <svg
                className="absolute left-3 top-3.5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            
            <div className="flex space-x-4">
              <select
                value={sortOption}
                onChange={handleSortChange}
                className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">A-Z</option>
              </select>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-primary text-white p-3 rounded-lg hover:bg-primary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>
          </div>
          
          {showFilters && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                    <option>All</option>
                    <option>Draft</option>
                    <option>Published</option>
                    <option>Archived</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                    <option>All</option>
                    <option>Programming</option>
                    <option>Design</option>
                    <option>Business</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center min-h-[300px]">
              <div className="loader border-t-4 border-primary rounded-full w-12 h-12 animate-spin"></div>
            </div>
          ) : courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
              <svg
                className="text-gray-300 w-24 h-24"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <p className="text-center text-gray-600">You have not created any courses yet.</p>
              <Link
                to="/create-course"
                className="mt-4 inline-block bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors"
              >
                Create Your First Course
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {courses
                .filter(course => 
                  course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  course.description.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map(course => (
                  <div key={course.id} className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition duration-300 group">
                    {course.thumbnailURL && (
                      <img
                        src={course.thumbnailURL}
                        alt={course.title}
                        className="h-40 w-full object-cover rounded-lg mb-4"
                      />
                    )}
                    
                    <div className="flex items-center mb-2">
                      <span className="text-sm font-medium text-gray-500">Status:</span>
                      <span 
                        className={`px-2 py-1 text-xs rounded-full ml-2 ${
                          course.status === "draft" 
                            ? "bg-yellow-100 text-yellow-800"
                            : course.status === "published"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-primary mb-2">{course.title}</h3>
                    <p className="text-gray-600 mb-4">{course.description}</p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-gray-500 mr-2">
                          <svg className="inline w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                          </svg>
                          {course.modules?.length || 0} Modules
                        </span>
                        <span className="text-gray-500 ml-4">
                          <svg className="inline w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM10 10a3 3 0 11-3 3 3 3 0 013-3zM1 14a1 1 0 112 0 1 1 0 01-2 0zM12 14a1 1 0 112 0 1 1 0 01-2 0zM14 14a1 1 0 112 0 1 1 0 01-2 0z" />
                          </svg>
                          ${course.price || "Free"}
                        </span>
                      </div>
                      <span className="text-gray-500">
                        <svg className="inline w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM10 10a3 3 0 11-3 3 3 3 0 013-3zM1 14a1 1 0 112 0 1 1 0 01-2 0zM12 14a1 1 0 112 0 1 1 0 01-2 0zM14 14a1 1 0 112 0 1 1 0 01-2 0z" />
                        </svg>
                        {course.enrolledCount || 0} Students
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4">
                      <Link
                        to={`/edit-course/${course.id}`}
                        className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition-colors"
                      >
                        Edit Course
                      </Link>
                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}