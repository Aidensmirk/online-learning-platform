import { useEffect, useState } from "react";
import { enrollmentsAPI } from "../Services/api";
import { getCurrentUser } from "../Services/authService";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function MyCourses() {
    const location = useLocation();
    const [courses, setCourses] = useState(location.state?.enrolledCourses || []);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEnrolledCourses = async () => {
            try {
                setLoading(true);
                const user = await getCurrentUser();
                if (!user) {
                    navigate('/login');
                    return;
                }

                const enrollmentsData = await enrollmentsAPI.getAll();
                const enrollments = Array.isArray(enrollmentsData) ? enrollmentsData : (enrollmentsData.results || []);
                
                // Extract courses from enrollments
                const enrolledCourses = enrollments.map(enrollment => ({
                    ...enrollment.course,
                    enrollmentId: enrollment.id,
                    progress: enrollment.progress,
                }));

                setCourses(enrolledCourses);
            } catch (error) {
                console.error("Error fetching enrolled courses:", error);
            } finally {
                setLoading(false);
            }
        };

        if (!courses.length || !location.state?.enrolledCourses) {
            fetchEnrolledCourses();
        }
    }, [courses.length, location.state?.enrolledCourses, navigate]);

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-100 p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-primary">My Courses</h1>
                            <p className="text-gray-600">Track your progress and jump back into lessons instantly.</p>
                        </div>
                        <Link
                            to="/all-courses"
                            className="inline-flex items-center gap-2 text-primary hover:text-primary/80"
                        >
                            Browse more courses
                            <span aria-hidden>→</span>
                        </Link>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="loader border-t-4 border-primary rounded-full w-12 h-12 animate-spin"></div>
                        </div>
                    ) : courses.length === 0 ? (
                        <div className="text-center text-gray-500 py-16 border border-dashed border-gray-300 rounded-lg">
                            You’re not enrolled in any courses yet. Discover something new!
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {courses.map((course) => (
                                <div key={course.id} className="bg-white rounded-xl shadow hover:shadow-lg transition p-6 flex flex-col">
                                    {course.thumbnail && (
                                        <img
                                            src={course.thumbnail.startsWith('http') ? course.thumbnail : `http://localhost:8000${course.thumbnail}`}
                                            alt={course.title}
                                            className="h-40 w-full object-cover rounded-lg mb-4"
                                        />
                                    )}
                                    <h2 className="text-xl font-semibold text-primary">{course.title}</h2>
                                    <p className="text-gray-600 mt-2 flex-1">{course.description}</p>
                                    <div className="mt-4">
                                        <div className="flex justify-between text-sm text-gray-500">
                                            <span>Progress</span>
                                            <span>{course.progress || 0}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                            <div
                                                className="bg-primary h-2 rounded-full"
                                                style={{ width: `${course.progress || 0}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div className="mt-6 flex gap-3">
                                        <Link
                                            to={`/course-player/${course.id}`}
                                            className="flex-1 bg-primary text-white text-center px-4 py-2 rounded-lg hover:bg-primary-dark transition"
                                        >
                                            Continue
                                        </Link>
                                        <Link
                                            to={`/course-details/${course.id}`}
                                            className="flex-1 border border-primary text-primary text-center px-4 py-2 rounded-lg hover:bg-primary/10 transition"
                                        >
                                            Details
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
