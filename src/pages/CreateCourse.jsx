import React from 'react';
import { db, storage } from '../Services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import { auth } from '../Services/firebase';
import CourseForm from "../components/CourseForm";

export default function CreateCourse() {
    const handleCreateCourse = async ({ title, description, thumbnail }) => {
        let thumbnailURL = "";
        if (thumbnail) {
            const storageRef = ref(storage, `course-thumbnails/${thumbnail.name}-${Date.now()}`);
            await uploadBytes(storageRef, thumbnail);
            thumbnailURL = await getDownloadURL(storageRef);
        }

        try {
            await addDoc(collection(db, "courses"), {
                title,
                description,
                instructorId: auth.currentUser.uid,
                createdAt: new Date(),
                thumbnailURL,
                status: "draft",
            });
        } catch (error) {
            console.error("Error creating course: ", error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 p-8">
            <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl p-8">
                <h2 className="text-3xl font-bold mb-6 text-primary text-center">Create a New Course</h2>
                <CourseForm onSubmit={handleCreateCourse} />
            </div>
        </div>
    );
}
