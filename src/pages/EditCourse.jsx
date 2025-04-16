import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, storage } from "../Services/firebase";
import CourseForm from "../components/CourseForm";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function EditCourse() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const courseDoc = await getDoc(doc(db, "courses", courseId));
                if (courseDoc.exists()) {
                    setCourse(courseDoc.data());
                } else {
                    console.error("Course not found");
                }
            } catch (error) {
                console.error("Error fetching course:", error);
            }
        };

        fetchCourse();
    }, [courseId]);

    const handleUpdateCourse = async ({ title, description, price, thumbnail, modules }) => {
        let thumbnailURL = course.thumbnailURL;
        if (thumbnail) {
            const storageRef = ref(storage, `course-thumbnails/${thumbnail.name}-${Date.now()}`);
            await uploadBytes(storageRef, thumbnail);
            thumbnailURL = await getDownloadURL(storageRef);
        }

        try {
            await updateDoc(doc(db, "courses", courseId), {
                title,
                description,
                price,
                thumbnailURL,
                modules,
            });
            navigate("/manage-courses");
        } catch (error) {
            console.error("Error updating course:", error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl p-8">
                <h2 className="text-3xl font-bold mb-6 text-primary text-center">Edit Course</h2>
                {course ? (
                    <CourseForm onSubmit={handleUpdateCourse} initialData={course} />
                ) : (
                    <p className="text-center text-gray-600">Loading course details...</p>
                )}
            </div>
        </div>
    );
}