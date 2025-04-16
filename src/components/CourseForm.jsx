import { useState } from "react";

export default function CourseForm({ onSubmit, initialData = {} }) {
    const [title, setTitle] = useState(initialData.title || "");
    const [description, setDescription] = useState(initialData.description || "");
    const [price, setPrice] = useState(initialData.price || "");
    const [thumbnail, setThumbnail] = useState(null);
    const [modules, setModules] = useState(initialData.modules || []);
    const [category, setCategory] = useState("programming"); // Default category

    const handleAddModule = () => {
        setModules([...modules, { title: "", lessons: [] }]);
    };

    const handleModuleChange = (index, value) => {
        const updatedModules = [...modules];
        updatedModules[index].title = value;
        setModules(updatedModules);
    };

    const handleAddLesson = (moduleIndex) => {
        const updatedModules = [...modules];
        updatedModules[moduleIndex].lessons.push({ title: "", video: null });
        setModules(updatedModules);
    };

    const handleLessonChange = (moduleIndex, lessonIndex, field, value) => {
        const updatedModules = [...modules];
        updatedModules[moduleIndex].lessons[lessonIndex][field] = value;
        setModules(updatedModules);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ title, description, price, thumbnail, modules, category });
        setTitle("");
        setDescription("");
        setPrice("");
        setThumbnail(null);
        setModules([]);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
            <input
                className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Course Title"
                required
            />
            <textarea
                className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Course Description"
                required
            />
            <input
                type="number"
                className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Course Price"
                required
            />
            <input
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnail(e.target.files[0])}
                className="w-full border border-gray-300 rounded-md p-3"
            />
            <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-3"
                required
            >
                <option value="programming">Programming</option>
                <option value="design">Design</option>
                <option value="business">Business</option>
                <option value="marketing">Marketing</option>
            </select>

            <div className="space-y-4">
                <h3 className="text-lg font-bold">Course Modules</h3>
                {modules.map((module, moduleIndex) => (
                    <div key={moduleIndex} className="border border-gray-300 rounded-md p-4">
                        <input
                            className="w-full border border-gray-300 rounded-md p-2 mb-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            value={module.title}
                            onChange={(e) => handleModuleChange(moduleIndex, e.target.value)}
                            placeholder={`Module ${moduleIndex + 1} Title`}
                            required
                        />
                        <div className="space-y-2">
                            {module.lessons.map((lesson, lessonIndex) => (
                                <div key={lessonIndex} className="border border-gray-200 rounded-md p-2">
                                    <input
                                        className="w-full border border-gray-300 rounded-md p-2 mb-2 focus:outline-none focus:ring-2 focus:ring-primary"
                                        value={lesson.title}
                                        onChange={(e) =>
                                            handleLessonChange(moduleIndex, lessonIndex, "title", e.target.value)
                                        }
                                        placeholder={`Lesson ${lessonIndex + 1} Title`}
                                        required
                                    />
                                    <input
                                        type="file"
                                        accept="video/*"
                                        onChange={(e) =>
                                            handleLessonChange(moduleIndex, lessonIndex, "video", e.target.files[0])
                                        }
                                        className="w-full border border-gray-300 rounded-md p-2"
                                    />
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => handleAddLesson(moduleIndex)}
                                className="text-primary hover:underline"
                            >
                                + Add Lesson
                            </button>
                        </div>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={handleAddModule}
                    className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition"
                >
                    + Add Module
                </button>
            </div>

            <button
                type="submit"
                className="w-full bg-primary text-white py-3 rounded-md hover:bg-primary-dark transition"
            >
                {initialData.title ? "Update Course" : "Create Course"}
            </button>
        </form>
    );
}