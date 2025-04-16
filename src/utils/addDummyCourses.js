import { collection, addDoc } from "firebase/firestore";
import { db } from "../Services/firebase";

const addDummyCourses = async () => {
  const dummyCourses = [
    {
      title: "Introduction to Programming",
      description: "Learn the basics of programming with this beginner-friendly course.",
      category: "programming",
      price: 49.99,
      thumbnailURL: "https://via.placeholder.com/150",
      rating: 4.5,
      enrolledCount: 120,
      modules: ["Introduction", "Variables", "Loops", "Functions"],
    },
    {
      title: "Advanced JavaScript",
      description: "Master JavaScript with advanced concepts and techniques.",
      category: "programming",
      price: 79.99,
      thumbnailURL: "https://via.placeholder.com/150",
      rating: 4.8,
      enrolledCount: 200,
      modules: ["ES6 Features", "Asynchronous Programming", "APIs", "Testing"],
    },
    {
      title: "Graphic Design Basics",
      description: "Learn the fundamentals of graphic design and create stunning visuals.",
      category: "design",
      price: 59.99,
      thumbnailURL: "https://via.placeholder.com/150",
      rating: 4.3,
      enrolledCount: 90,
      modules: ["Design Principles", "Typography", "Color Theory", "Tools"],
    },
    {
      title: "Business Management 101",
      description: "Understand the basics of managing a business effectively.",
      category: "business",
      price: 99.99,
      thumbnailURL: "https://via.placeholder.com/150",
      rating: 4.6,
      enrolledCount: 150,
      modules: ["Leadership", "Finance", "Marketing", "Operations"],
    },
    {
      title: "Digital Marketing Strategies",
      description: "Learn how to create and execute effective digital marketing campaigns.",
      category: "marketing",
      price: 69.99,
      thumbnailURL: "https://via.placeholder.com/150",
      rating: 4.7,
      enrolledCount: 180,
      modules: ["SEO", "Social Media", "Email Marketing", "Analytics"],
    },
    {
      title: "UI/UX Design Essentials",
      description: "Master the art of designing user-friendly interfaces and experiences.",
      category: "design",
      price: 89.99,
      thumbnailURL: "https://via.placeholder.com/150",
      rating: 4.9,
      enrolledCount: 220,
      modules: ["User Research", "Wireframing", "Prototyping", "Usability Testing"],
    },
  ];

  try {
    for (const course of dummyCourses) {
      await addDoc(collection(db, "courses"), {
        ...course,
        createdAt: new Date(),
        instructorId: "dummyInstructorId", // Replace with a valid instructor ID if needed
        status: "published",
      });
    }
    console.log("Dummy courses added successfully!");
  } catch (error) {
    console.error("Error adding dummy courses:", error);
  }
};

export default addDummyCourses;