import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "../Services/firebase";
import { Link } from "react-router-dom";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";

function Navbar() {
    return (
        <nav className="flex justify-between items-center p-4 bg-primary text-white shadow-md">
            <div className="text-xl font-bold">
                <Link to="/" className="hover:text-accent">E-Learning</Link>
            </div>
            <div className="flex space-x-6">
                <Link to="/student-dashboard" className="hover:text-accent">Course Library</Link>
                <Link to="/my-courses" className="hover:text-accent">My Courses</Link>
                <Link to="/profile" className="hover:text-accent">Profile</Link>
            </div>
        </nav>
    );
}

export default function MyProfile() {
    const [displayName, setDisplayName] = useState(auth.currentUser.displayName || "");
    const [email, setEmail] = useState(auth.currentUser.email);
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEnrolledCourses = async () => {
            try {
                const q = query(collection(db, "enrollments"), where("studentId", "==", auth.currentUser.uid));
                const querySnapshot = await getDocs(q);
                const courseIds = querySnapshot.docs.map(doc => doc.data().courseId);

                if (courseIds.length > 0) {
                    const coursesQuery = query(collection(db, "courses"), where("__name__", "in", courseIds));
                    const coursesSnapshot = await getDocs(coursesQuery);
                    const courses = coursesSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                    }));
                    setEnrolledCourses(courses);
                }
            } catch (error) {
                console.error("Error fetching enrolled courses:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEnrolledCourses();
    }, []);

    const handleUpdate = async () => {
        try {
            await updateProfile(auth.currentUser, { displayName });
            await updateDoc(doc(db, "users", auth.currentUser.uid), { displayName });
            alert("Profile updated successfully!");
        } catch (error) {
            console.error("Error updating profile:", error);
        }
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 p-8">
                <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl p-8">
                    <h2 className="text-3xl font-bold mb-6 text-primary text-center">My Profile</h2>
                    <div className="text-center mb-6">
                        <p className="text-lg text-gray-600">Welcome, {auth.currentUser.displayName || "Student"}!</p>
                        <p className="text-sm text-gray-500">Email: {auth.currentUser.email}</p>
                    </div>
                    <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Display Name"
                        className="w-full p-3 border rounded mb-4"
                    />
                    <input
                        type="email"
                        value={email}
                        disabled
                        className="w-full p-3 border rounded mb-4 bg-gray-200"
                    />
                    <button
                        onClick={handleUpdate}
                        className="w-full bg-primary text-white py-3 rounded hover:bg-primary-dark transition duration-300"
                    >
                        Update Profile
                    </button>
                </div>

                <div className="p-8">
                    <h3 className="text-2xl font-bold mb-4 text-primary">Enrolled Courses</h3>
                    {loading ? (
                        <div className="flex justify-center items-center">
                            <div className="loader border-t-4 border-indigo-500 rounded-full w-12 h-12 animate-spin"></div>
                        </div>
                    ) : enrolledCourses.length === 0 ? (
                        <p className="text-center text-gray-600">You have not enrolled in any courses yet.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {enrolledCourses.map(course => (
                                <div key={course.id} className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition duration-300">
                                    <img
                                        src={course.thumbnailURL}
                                        alt={course.title}
                                        className="h-32 w-full object-cover rounded-md mb-3"
                                    />
                                    <h3 className="text-lg font-semibold text-primary">{course.title}</h3>
                                    <p className="text-sm text-gray-600 mb-2">{course.description}</p>
                                    <p className="text-sm text-gray-500 mb-4">Enrolled Students: {course.enrolledCount || 0}</p>
                                    <Link
                                        to={`/course-details/${course.id}`}
                                        className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition duration-300"
                                    >
                                        View Course
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}