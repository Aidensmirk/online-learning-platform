import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../Services/firebase";
import { Link } from "react-router-dom";

function Navbar() {
    return (
        <nav className="flex justify-between items-center p-4 bg-primary text-white shadow-md">
            <div className="text-xl font-bold">
                <Link to="/" className="hover:text-accent">E-Learning</Link>
            </div>
            <div className="flex space-x-6">
                <Link to="/" className="hover:text-accent">Home</Link>
                <Link to="/all-courses" className="hover:text-accent">All Courses</Link>
                <Link to="/login" className="hover:text-accent">Login</Link>
                <Link to="/register" className="hover:text-accent">Sign Up</Link>
            </div>
        </nav>
    );
}

export default function AllCourses() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const dummyCourses = [
                    {
                        id: "1",
                        title: "Introduction to JavaScript",
                        description: "Learn the basics of JavaScript, the most popular programming language.",
                        thumbnailURL: "src/assets/undraw_source-code_m0vh.svg",
                        price: 49.99,
                        category: "Programming",
                    },
                    {
                        id: "2",
                        title: "React for Beginners",
                        description: "A beginner's guide to building modern web applications with React.",
                        thumbnailURL: "src/assets/undraw_dev-focus_dd7i.svg",
                        price: 59.99,
                        category: "Programming",
                    },
                    {
                        id: "3",
                        title: "Mastering CSS",
                        description: "Become a pro at styling websites with CSS.",
                        thumbnailURL: "src/assets/undraw_static-website_x3tn.svg",
                        price: 39.99,
                        category: "Design",
                    },
                    {
                        id: "4",
                        title: "Introduction to Flutter Development",
                        description: "Learn the basics of Flutter Development.",
                        thumbnailURL: "src/assets/undraw_flutter-dev_c8s7.svg",
                        price: 69.99,
                        category: "Programming",
                    },
                    {
                        id: "5",
                        title: "Gatsby for Beginners",
                        description: "A beginner's guide to building modern web applications with Gatsby.",
                        thumbnailURL: "src/assets/undraw_gatsby-js_wd5s.svg",
                        price: 49.99,
                        category: "Programming",
                    },
                    {
                        id: "6",
                        title: "Mastering Ethical Hacking",
                        description: "Become a pro at ethical hacking.",
                        thumbnailURL: "src/assets/undraw_hacker-mind_j91b.svg",
                        price: 89.99,
                        category: "Programming",
                    },
                    {
                        id: "7",
                        title: "Python for Data Science",
                        description: "Learn Python and its applications in data science.",
                        thumbnailURL: "src/assets/undraw_data-science.svg",
                        price: 79.99,
                        category: "Programming",
                    },
                    {
                        id: "8",
                        title: "UI/UX Design Fundamentals",
                        description: "Master the basics of UI/UX design and create stunning interfaces.",
                        thumbnailURL: "src/assets/undraw_design.svg",
                        price: 59.99,
                        category: "Design",
                    },
                    {
                        id: "9",
                        title: "Machine Learning with Python",
                        description: "Dive into machine learning concepts and build predictive models.",
                        thumbnailURL: "src/assets/undraw_machine-learning.svg",
                        price: 99.99,
                        category: "Programming",
                    },
                    {
                        id: "10",
                        title: "DevOps Essentials",
                        description: "Learn the fundamentals of DevOps and CI/CD pipelines.",
                        thumbnailURL: "src/assets/undraw_devops.svg",
                        price: 69.99,
                        category: "Programming",
                    },
                    {
                        id: "11",
                        title: "Cloud Computing with AWS",
                        description: "Understand cloud computing concepts and AWS services.",
                        thumbnailURL: "src/assets/undraw_cloud-computing.svg",
                        price: 89.99,
                        category: "Programming",
                    },
                    {
                        id: "12",
                        title: "Advanced Node.js",
                        description: "Master backend development with advanced Node.js concepts.",
                        thumbnailURL: "src/assets/undraw_server_cluster_jwwq.svg",
                        price: 79.99,
                        category: "Programming",
                    },
                ];

                setCourses(dummyCourses);
            } catch (error) {
                console.error("Error fetching courses:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    const filteredCourses = selectedCategory === "All"
        ? courses
        : courses.filter(course => course.category === selectedCategory);

    useEffect(() => {
        const filtered = courses.filter(course =>
            course.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredCourses(filtered);
    }, [searchQuery, courses]);

    return (
        <>
            <Navbar />
            <div className="bg-gradient-to-b from-gray-50 to-gray-200 py-24 px-8 min-h-[80vh]">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between">

                    <div className="md:w-1/2 text-center md:text-left">
                        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6 " >
                            Welcome to E-Learning
                        </h1>
                        <p className="text-lg text-gray-600 mb-6">
                            Discover a wide range of expertly curated courses to help you learn new skills, grow your career, and achieve your goals.
                        </p>
                        <Link
                            to="/register"
                            className="bg-primary text-white px-6 py-3 rounded-lg shadow-lg hover:bg-primary-dark transition duration-300"
                        >
                            Get Started
                        </Link>
                    </div>

                    <div className="md:w-1/2 flex justify-center mt-8 md:mt-0 ">
                        <img
                            src="src/assets/undraw_programming_65t2.svg"
                            alt="Online Learning"
                            className="w-3/4 max-w-md"
                        />
                    </div>
                </div>
            </div>

            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 p-8">
                <div className="max-w-6xl mx-auto shadow-xl rounded-2xl p-8">
                    <h2 className="text-3xl font-bold mb-6 text-primary text-center">All Courses</h2>
                    <input
                        type="text"
                        placeholder="Search courses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full p-3 border rounded mb-4"
                    />
                    <div className="flex space-x-4 mb-4">
                        {["All", "Programming", "Design", "Marketing"].map(category => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-4 py-2 rounded ${selectedCategory === category ? "bg-primary text-white" : "bg-gray-200"}`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                    {loading ? (
                        <div className="flex justify-center items-center">
                            <div className="loader border-t-4 border-primary rounded-full w-12 h-12 animate-spin"></div>
                        </div>
                    ) : filteredCourses.length === 0 ? (
                        <p className="text-center text-gray-600">No courses available at the moment.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {filteredCourses.map(course => (
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
                                    <p className="text-sm text-gray-500 mb-4">Price: ${course.price || "Free"}</p>
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
        </>
    );
}