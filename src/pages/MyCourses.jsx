import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../Services/firebase";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

export default function MyCourses() {
    const location = useLocation();
    const [courses, setCourses] = useState(location.state?.enrolledCourses || []);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!courses.length) {
            setLoading(true);
            // Fetch enrolled courses if not passed via state
            const fetchEnrolledCourses = async () => {
                try {
                    const user = auth.currentUser;
                    if (!user) return;

                    const userRef = doc(db, "users", user.uid);
                    const userData = await getDoc(userRef);

                    if (userData.exists()) {
                        const enrolledCourseIds = userData.data().enrolledCourses || [];
                        const enrolledCourses = await Promise.all(
                            enrolledCourseIds.map(async (courseId) => {
                                const courseDoc = await getDoc(doc(db, "courses", courseId));
                                if (courseDoc.exists()) {
                                    return { id: courseDoc.id, ...courseDoc.data() };
                                }
                                return null;
                            })
                        );

                        setCourses(enrolledCourses.filter((course) => course !== null));
                    }
                } catch (error) {
                    console.error("Error fetching enrolled courses:", error);
                } finally {
                    setLoading(false);
                }
            };

            fetchEnrolledCourses();
        }
    }, [courses]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 p-8">
            <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-2xl p-8">
                {/* Back to Dashboard Button */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate("/student-dashboard")}
                        className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition duration-300"
                    >
                        Back to Dashboard
                    </button>
                </div>

                <h2 className="text-3xl font-bold mb-6 text-primary text-center">My Courses</h2>
                {loading ? (
                    <div className="flex justify-center items-center">
                        <div className="loader border-t-4 border-primary rounded-full w-12 h-12 animate-spin"></div>
                    </div>
                ) : courses.length === 0 ? (
                    <p className="text-center text-gray-600">You have not enrolled in any courses yet.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {courses.map((course) => (
                            <div key={course.id} className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition duration-300">
                                {course.thumbnailURL && (
                                    <img
                                        src={course.thumbnailURL}
                                        alt={course.title}
                                        className="h-40 w-full object-cover rounded-md mb-3"
                                    />
                                )}
                                <h3 className="text-lg font-semibold text-primary">{course.title}</h3>
                                <p className="text-sm text-gray-600 mb-2">{course.description}</p>
                                <Link
                                    to={`/course-details/${course.id}`}
                                    className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition duration-300"
                                >
                                    View Details
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
