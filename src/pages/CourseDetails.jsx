import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { coursesAPI, enrollmentsAPI, wishlistAPI } from "../Services/api";
import { getCurrentUser } from "../Services/authService";
import { useNotification } from "../context/NotificationContext";
import Navbar from "../components/Navbar";

export default function CourseDetails() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState("");
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const courseData = await coursesAPI.getById(courseId);
        setCourse(courseData);
        
        // Check if user is enrolled
        try {
          const enrollments = await enrollmentsAPI.getAll();
          const enrollmentsList = Array.isArray(enrollments) ? enrollments : (enrollments.results || []);
          const isEnrolled = enrollmentsList.some(
            enrollment => enrollment.course?.id === parseInt(courseId) || enrollment.course === parseInt(courseId)
          );
          setEnrolled(isEnrolled);
        } catch (err) {
          // User might not be logged in
          setEnrolled(false);
        }
      } catch (error) {
        console.error("Error fetching course details:", error);
      } finally {
        setLoading(false);
      }
    };

    // Reviews not yet implemented in Django backend
    setReviews([]);

    fetchCourse();
  }, [courseId]);

  const handleEnroll = async () => {
    try {
      await coursesAPI.enroll(courseId);
      setEnrolled(true);
      addNotification("Successfully enrolled in course!", "success");
    } catch (error) {
      console.error("Error enrolling in course:", error);
      addNotification("Failed to enroll. Please try again.", "error");
    }
  };

  const handleAddReview = async () => {
    if (!newReview || rating === 0) {
      alert("Please provide a review and a rating.");
      return;
    }

    // Reviews feature not yet implemented in Django backend
    addNotification("Review feature coming soon!", "info");
    // TODO: Implement reviews API endpoint in Django
  };

  const handlePayment = () => {
    navigate("/payment");
  };

  const handleAddToWishlist = async () => {
    try {
      await coursesAPI.addToWishlist(courseId);
      addNotification("Course added to wishlist!", "success");
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      addNotification("Failed to add course to wishlist. Please try again.", "error");
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!course) {
    return <div className="flex justify-center items-center min-h-screen">Course not found.</div>;
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 p-8">
        <motion.div
          className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl font-bold mb-6 text-gray-800">{course.title}</h2>
          <p className="text-gray-600 mb-4">{course.description}</p>
          {course.thumbnail && (
            <motion.img
              src={course.thumbnail.startsWith('http') ? course.thumbnail : `http://localhost:8000${course.thumbnail}`}
              alt={course.title}
              className="w-full h-64 object-cover rounded-lg mb-6"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            />
          )}
          <p className="text-lg font-semibold text-gray-700 mb-4">
            Price: <span className="text-green-600">${course.price || "Free"}</span>
          </p>
          {enrolled ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-green-600 font-semibold">You're enrolled in this course!</span>
              <Link
                to={`/course-player/${course.id}`}
                className="bg-primary text-white px-6 py-3 rounded-lg shadow-lg hover:bg-primary-dark transition duration-300"
              >
                Go to Course Player
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <motion.button
                onClick={handleEnroll}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700 transition duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Enroll Now
              </motion.button>
              <motion.button
                onClick={handlePayment}
                className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-green-700 transition duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Proceed to Payment
              </motion.button>
              <motion.button
                onClick={handleAddToWishlist}
                className="bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-yellow-600 transition duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Add to Wishlist
              </motion.button>
            </div>
          )}
          <Link
            to="/student-dashboard"
            className="block mt-6 text-green  -600 hover:underline"
          >
            Back to Dashboard
          <motion.div
            className="mt-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-semibold text-gray-800">Course Content</h3>
                {!enrolled && (
                  <span className="text-sm text-gray-500">
                    Enroll to unlock the full curriculum overview.
                  </span>
                )}
              </div>

              {enrolled ? (
                course.modules && course.modules.length > 0 ? (
                  <div className="space-y-6">
                    {course.modules.map((module) => (
                      <div key={module.id} className="border border-gray-200 rounded-lg p-5">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="text-xl font-semibold text-primary">{module.title}</h4>
                            {module.description && (
                              <p className="text-gray-600 mt-1">{module.description}</p>
                            )}
                          </div>
                          <span className="text-sm text-gray-500">Module {module.order}</span>
                        </div>
                        <div className="space-y-4">
                          {module.lessons && module.lessons.length > 0 && (
                            <div>
                              <h5 className="text-lg font-semibold text-gray-700 mb-2">Lessons</h5>
                              <ul className="space-y-2">
                                {module.lessons.map((lesson) => (
                                  <li
                                    key={lesson.id}
                                    className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2"
                                  >
                                    <span className="text-gray-700">{lesson.title}</span>
                                    <span className="text-xs text-gray-500">
                                      {lesson.duration_minutes || 0} min
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {module.assignments && module.assignments.length > 0 && (
                            <div>
                              <h5 className="text-lg font-semibold text-gray-700 mb-2">Assignments</h5>
                              <ul className="space-y-2">
                                {module.assignments.map((assignment) => (
                                  <li
                                    key={assignment.id}
                                    className="border border-dashed border-gray-300 rounded-md px-3 py-2 text-gray-700"
                                  >
                                    {assignment.title}
                                    {assignment.due_date && (
                                      <span className="block text-xs text-gray-500">
                                        Due {new Date(assignment.due_date).toLocaleString()}
                                      </span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {module.quizzes && module.quizzes.length > 0 && (
                            <div>
                              <h5 className="text-lg font-semibold text-gray-700 mb-2">Quizzes</h5>
                              <ul className="space-y-2">
                                {module.quizzes.map((quiz) => (
                                  <li
                                    key={quiz.id}
                                    className="border border-dashed border-gray-300 rounded-md px-3 py-2 text-gray-700"
                                  >
                                    {quiz.title}
                                    {quiz.description && (
                                      <span className="block text-xs text-gray-500">
                                        {quiz.description}
                                      </span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Course modules are coming soon.</p>
                )
              ) : (
                <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500">
                  Enroll in this course to reveal the full module and lesson breakdown.
                </div>
              )}
            </div>
          </motion.div>

          </Link>
        </motion.div>

        <motion.div
          className="mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold mb-4">Leave a Review</h2>
          <textarea
            value={newReview}
            onChange={(e) => setNewReview(e.target.value)}
            placeholder="Write your review here..."
            className="w-full p-3 border rounded mb-4"
          />
          <div className="flex items-center mb-4">
            <label className="mr-2">Rating:</label>
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="p-2 border rounded"
            >
              <option value={0}>Select Rating</option>
              {[1, 2, 3, 4, 5].map((star) => (
                <option key={star} value={star}>
                  {star} Star{star > 1 && "s"}
                </option>
              ))}
            </select>
          </div>
          <motion.button
            onClick={handleAddReview}
            className="bg-green-600 text-white px-6 py-3 rounded hover:bg-red-700 transition duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Submit Review
          </motion.button>
        </motion.div>

        <motion.div
          className="mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold mb-4">Reviews</h2>
          {reviews.length === 0 ? (
            <p>No reviews yet. Be the first to leave a review!</p>
          ) : (
            <ul className="space-y-4">
              {reviews.map((review, index) => (
                <motion.li
                  key={index}
                  className="p-4 border rounded shadow"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <p className="text-lg font-semibold">Rating: {review.rating} Stars</p>
                  <p>{review.review}</p>
                  <p className="text-sm text-gray-500">- {review.studentId}</p>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </>
  );
}