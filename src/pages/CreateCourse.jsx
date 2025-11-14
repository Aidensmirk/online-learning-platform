import React from 'react';
import { coursesAPI } from '../Services/api';
import CourseForm from "../components/CourseForm";
import Navbar from "../components/Navbar";

export default function CreateCourse() {
    const handleCreateCourse = async ({ title, description, thumbnail, price, category }) => {
        try {
            const courseData = {
                title,
                description,
                thumbnail: thumbnail || null,
                price: price || 0,
                category: category || '',
                status: "draft",
            };
            await coursesAPI.create(courseData);
            alert('Course created successfully!');
        } catch (error) {
            console.error("Error creating course: ", error);
            alert('Failed to create course. Please try again.');
        }
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 p-8">
                <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl p-8">
                    <h2 className="text-3xl font-bold mb-6 text-primary text-center">Create a New Course</h2>
                    <CourseForm onSubmit={handleCreateCourse} />
                </div>
            </div>
        </>
    );
}
