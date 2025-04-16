import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db, auth } from "../Services/firebase";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";

export default function CoursePlayer() {
    const { courseId } = useParams();
    const [course, setCourse] = useState(null);
    const [completedLessons, setCompletedLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCompletion, setShowCompletion] = useState(false);

    useEffect(() => {
        const fetchCourse = async () => {
            try {

                const courseDoc = await getDoc(doc(db, "courses", courseId));
                if (courseDoc.exists()) {
                    setCourse(courseDoc.data());
                }


                const enrollmentDoc = await getDoc(
                    doc(db, "enrollments", `${auth.currentUser.uid}_${courseId}`)
                );
                if (enrollmentDoc.exists()) {
                    setCompletedLessons(enrollmentDoc.data().completedLessons || []);
                }
            } catch (error) {
                console.error("Error fetching course or progress:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourse();
    }, [courseId]);

    const handleMarkComplete = async (lessonId) => {
        try {

            await updateDoc(doc(db, "enrollments", `${auth.currentUser.uid}_${courseId}`), {
                completedLessons: arrayUnion(lessonId),
            });


            setCompletedLessons((prev) => [...prev, lessonId]);
        } catch (error) {
            console.error("Error marking lesson as complete:", error);
        }
    };

    useEffect(() => {
        if (course && completedLessons.length === course.modules.reduce((total, module) => total + module.lessons.length, 0)) {
            setShowCompletion(true);
            setTimeout(() => setShowCompletion(false), 2000);
        }
    }, [completedLessons, course]);

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
    }

    if (!course) {
        return <div className="flex justify-center items-center min-h-screen">Course not found.</div>;
    }

    const totalLessons = course.modules.reduce(
        (total, module) => total + module.lessons.length,
        0
    );
    const completedCount = completedLessons.length;
    const progress = Math.round((completedCount / totalLessons) * 100);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 p-8">
            <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl p-8">
                <h2 className="text-3xl font-bold mb-6 text-primary">{course.title}</h2>
                <p className="text-gray-600 mb-4">{course.description}</p>


                <div className="mb-6">
                    <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-primary">Progress</span>
                        <span className="text-sm font-medium text-gray-600">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                            className="bg-primary h-4 rounded-full"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>


                {showCompletion && (
                    <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6 text-center font-semibold">
                        🎉 Congratulations! You have completed this course! 🎉
                    </div>
                )}


                <div className="space-y-6">
                    {course.modules.map((module, moduleIndex) => (
                        <div key={moduleIndex} className="border rounded-lg p-4 shadow-sm">
                            <h3 className="text-lg font-semibold text-primary mb-3">
                                {module.title}
                            </h3>
                            <ul className="space-y-2">
                                {module.lessons.map((lesson, lessonIndex) => (
                                    <li
                                        key={lessonIndex}
                                        className="flex justify-between items-center"
                                    >
                                        <span
                                            className={`text-gray-700 ${completedLessons.includes(lesson.id)
                                                    ? "line-through"
                                                    : ""
                                                }`}
                                        >
                                            {lesson.title}
                                        </span>
                                        <button
                                            onClick={() => handleMarkComplete(lesson.id)}
                                            disabled={completedLessons.includes(lesson.id)}
                                            className={`px-4 py-2 rounded ${completedLessons.includes(lesson.id)
                                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                    : "bg-primary text-white hover:bg-primary-dark transition"
                                                }`}
                                        >
                                            {completedLessons.includes(lesson.id)
                                                ? "Completed"
                                                : "Mark Complete"}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}