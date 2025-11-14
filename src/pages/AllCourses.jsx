import { useEffect, useState } from "react";
import { coursesAPI } from "../Services/api";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function AllCourses() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const params = {};
                if (selectedCategory !== "All") {
                    params.category = selectedCategory;
                }
                if (searchQuery) {
                    params.search = searchQuery;
                }
                const response = await coursesAPI.getAll(params);
                setCourses(response.results || response);
            } catch (error) {
                console.error("Error fetching courses:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, [selectedCategory, searchQuery]);

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-100 p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-primary">Discover Courses</h1>
                            <p className="text-gray-600">Search, filter, and enroll in courses that match your goals.</p>
                        </div>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                placeholder="Search courses..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="All">All Categories</option>
                                <option value="programming">Programming</option>
                                <option value="design">Design</option>
                                <option value="business">Business</option>
                                <option value="marketing">Marketing</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="loader border-t-4 border-primary rounded-full w-12 h-12 animate-spin"></div>
                        </div>
                    ) : courses.length === 0 ? (
                        <div className="text-center text-gray-500 py-16 border border-dashed border-gray-300 rounded-lg">
                            No courses found. Try adjusting your filters.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {courses.map((course) => (
                                <div key={course.id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-5 flex flex-col">
                                    {course.thumbnail && (
                                        <img
                                            src={course.thumbnail.startsWith('http') ? course.thumbnail : `http://localhost:8000${course.thumbnail}`}
                                            alt={course.title}
                                            className="h-40 w-full object-cover rounded mb-4"
                                        />
                                    )}
                                    <h2 className="text-xl font-semibold text-primary">{course.title}</h2>
                                    <p className="text-gray-600 mt-2 flex-1">{course.description}</p>
                                    <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                                        <span>Category: {course.category || "General"}</span>
                                        <span className="font-semibold text-primary">${course.price || "Free"}</span>
                                    </div>
                                    <div className="mt-6 flex gap-3">
                                        <Link
                                            to={`/course-details/${course.id}`}
                                            className="flex-1 bg-primary text-white text-center px-4 py-2 rounded-lg hover:bg-primary-dark transition"
                                        >
                                            View Details
                                        </Link>
                                        <Link
                                            to={`/course-player/${course.id}`}
                                            className="flex-1 border border-primary text-primary text-center px-4 py-2 rounded-lg hover:bg-primary/10 transition"
                                        >
                                            Preview
                                        </Link>
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