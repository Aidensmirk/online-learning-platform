import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { collection, getDocs, addDoc, serverTimestamp, doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../Services/firebase";
import { useNotification } from "../context/NotificationContext";

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
        const courseDoc = await getDoc(doc(db, "courses", courseId));
        if (courseDoc.exists()) {
          setCourse(courseDoc.data());
        }

        const enrollmentDoc = await getDoc(doc(db, "enrollments", `${auth.currentUser.uid}_${courseId}`));
        if (enrollmentDoc.exists()) {
          setEnrolled(true);
        }
      } catch (error) {
        console.error("Error fetching course details:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchReviews = async () => {
      const reviewsSnapshot = await getDocs(collection(db, "reviews", courseId, "courseReviews"));
      const reviewsData = reviewsSnapshot.docs.map(doc => doc.data());
      setReviews(reviewsData);
    };

    fetchCourse();
    fetchReviews();
  }, [courseId]);

  const handleEnroll = async () => {
    try {
      await setDoc(doc(db, "enrollments", `${auth.currentUser.uid}_${courseId}`), {
        studentId: auth.currentUser.uid,
        courseId: courseId,
        enrolledAt: new Date(),
      });
      setEnrolled(true);
    } catch (error) {
      console.error("Error enrolling in course:", error);
    }
  };

  const handleAddReview = async () => {
    if (!newReview || rating === 0) {
      alert("Please provide a review and a rating.");
      return;
    }

    try {
      await addDoc(collection(db, "reviews", courseId, "courseReviews"), {
        studentId: auth.currentUser.uid,
        review: newReview,
        rating,
        createdAt: serverTimestamp(),
      });
      setNewReview("");
      setRating(0);
      addNotification("Review added successfully!", "success");
      const reviewsSnapshot = await getDocs(collection(db, "reviews", courseId, "courseReviews"));
      const reviewsData = reviewsSnapshot.docs.map(doc => doc.data());
      setReviews(reviewsData);
    } catch (error) {
      console.error("Error adding review:", error);
      addNotification("Failed to add review. Please try again.", "error");
    }
  };

  const handlePayment = () => {
    navigate("/payment");
  };

  const handleAddToWishlist = async () => {
    try {
      await setDoc(doc(db, "wishlist", `${auth.currentUser.uid}_${courseId}`), {
        studentId: auth.currentUser.uid,
        courseId: courseId,
        createdAt: serverTimestamp(),
      });
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
    <div className="min-h-screen bg-gray-50 p-8">
      <motion.div
        className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-4xl font-bold mb-6 text-gray-800">{course.title}</h2>
        <p className="text-gray-600 mb-4">{course.description}</p>
        {course.thumbnailURL && (
          <motion.img
            src={course.thumbnailURL}
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
          <p className="text-green-600 font-semibold">You are already enrolled in this course!</p>
        ) : (
          <motion.button
            onClick={handleEnroll}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700 transition duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Enroll Now
          </motion.button>
        )}
        {!enrolled && (
          <motion.button
            onClick={handlePayment}
            className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-green-700 transition duration-300 mt-4"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Proceed to Payment
          </motion.button>
        )}
        {!enrolled && (
          <motion.button
            onClick={handleAddToWishlist}
            className="bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-yellow-600 transition duration-300 mt-4"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Add to Wishlist
          </motion.button>
        )}
        <Link
          to="/student-dashboard"
          className="block mt-6 text-green  -600 hover:underline"
        >
          Back to Dashboard
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
  );
}