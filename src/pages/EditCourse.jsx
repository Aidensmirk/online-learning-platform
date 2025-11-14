import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { coursesAPI, API_ORIGIN } from "../Services/api";
import CourseForm from "../components/CourseForm";
import PageLayout from "../components/PageLayout";
import { useTheme } from "../context/ThemeContext";

export default function EditCourse() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { darkMode } = useTheme();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                setLoading(true);
                const courseData = await coursesAPI.getById(courseId);
                
                // Transform Django course structure to match CourseForm expectations
                const transformedCourse = {
                    title: courseData.title || "",
                    description: courseData.description || "",
                    price: courseData.price || 0,
                    category: courseData.category || "programming",
                    thumbnail: courseData.thumbnail || null,
                    // Transform modules structure
                    modules: (courseData.modules || []).map((module) => ({
                        id: module.id,
                        title: module.title || "",
                        description: module.description || "",
                        order: module.order || 1,
                        lessons: (module.lessons || []).map((lesson) => ({
                            id: lesson.id,
                            title: lesson.title || "",
                            video_url: lesson.video_url || "",
                            content: lesson.content || "",
                            overview: lesson.overview || "",
                            resource_link: lesson.resource_link || "",
                            order: lesson.order || 1,
                            duration_minutes: lesson.duration_minutes || 0,
                        })),
                    })),
                };
                
                setCourse(transformedCourse);
            } catch (err) {
                console.error("Error fetching course:", err);
                setError(err.response?.data?.detail || "Failed to load course. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchCourse();
    }, [courseId]);

    const handleUpdateCourse = async ({ title, description, price, thumbnail, modules, category }) => {
        try {
            // Prepare course data for update
            const courseData = {
                title,
                description,
                price: price || 0,
                category: category || "programming",
            };

            // Add thumbnail if provided
            if (thumbnail) {
                courseData.thumbnail = thumbnail;
            }

            // Update the course
            await coursesAPI.update(courseId, courseData);

            // Note: Modules and lessons are managed separately through ManageCourses
            // For now, we'll just update the course basic info
            // Full module/lesson editing should be done through ManageCourses page
            
            alert("Course updated successfully!");
            navigate("/manage-courses");
        } catch (err) {
            console.error("Error updating course:", err);
            const errorMessage = err.response?.data?.detail || err.response?.data?.message || "Failed to update course. Please try again.";
            alert(errorMessage);
        }
    };

    if (loading) {
        return (
            <PageLayout>
                <div className="flex justify-center items-center min-h-screen">
                    <div className="loader border-t-4 border-primary rounded-full w-12 h-12 animate-spin"></div>
                </div>
            </PageLayout>
        );
    }

    if (error) {
        return (
            <PageLayout>
                <div className={`min-h-screen p-8 ${darkMode ? "bg-gray-900" : "bg-gray-100"}`}>
                    <div className="max-w-4xl mx-auto bg-red-100 text-red-700 p-4 rounded-lg">
                        {error}
                    </div>
                </div>
            </PageLayout>
        );
    }

    if (!course) {
        return (
            <PageLayout>
                <div className={`min-h-screen p-8 ${darkMode ? "bg-gray-900" : "bg-gray-100"}`}>
                    <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl p-8">
                        <p className="text-center text-gray-600">Course not found.</p>
                    </div>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout>
            <div className={`min-h-screen p-8 transition-colors ${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"}`}>
                <div className={`max-w-4xl mx-auto shadow-xl rounded-2xl p-8 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                    <div className="mb-6">
                        <button
                            onClick={() => navigate("/manage-courses")}
                            className="text-primary hover:text-primary-dark mb-4 inline-flex items-center gap-2"
                        >
                            ← Back to Manage Courses
                        </button>
                        <h2 className="text-3xl font-bold text-primary text-center">Edit Course</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
                            Note: To edit modules, lessons, assignments, and quizzes, use the Manage Courses page.
                        </p>
                    </div>
                    <CourseForm onSubmit={handleUpdateCourse} initialData={course} />
                </div>
            </div>
        </PageLayout>
    );
}