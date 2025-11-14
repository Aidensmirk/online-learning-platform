import { useEffect, useState } from "react";
import { wishlistAPI } from "../Services/api";
import { getCurrentUser } from "../Services/authService";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          navigate('/login');
          return;
        }

        const wishlistData = await wishlistAPI.getAll();
        const wishlistItems = Array.isArray(wishlistData) ? wishlistData : (wishlistData.results || []);
        
        // Extract courses from wishlist items
        const courses = wishlistItems.map(item => ({
          ...item.course,
          wishlistId: item.id,
        }));
        
        setWishlist(courses);
      } catch (error) {
        console.error("Error fetching wishlist:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [navigate]);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-primary">My Wishlist</h1>
              <p className="text-gray-600">Keep track of courses you want to take next.</p>
            </div>
            <Link
              to="/all-courses"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80"
            >
              Browse more courses
              <span aria-hidden>→</span>
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="loader border-t-4 border-primary rounded-full w-12 h-12 animate-spin"></div>
            </div>
          ) : wishlist.length === 0 ? (
            <div className="text-center text-gray-500 py-16 border border-dashed border-gray-300 rounded-lg">
              Your wishlist is empty. Explore new topics and add courses you love.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {wishlist.map((course) => (
                <div key={course.id} className="bg-white rounded-xl shadow hover:shadow-lg transition p-6 flex flex-col">
                  {course.thumbnail && (
                    <img
                      src={course.thumbnail.startsWith('http') ? course.thumbnail : `http://localhost:8000${course.thumbnail}`}
                      alt={course.title}
                      className="h-40 w-full object-cover rounded-lg mb-4"
                    />
                  )}
                  <h2 className="text-xl font-semibold text-primary">{course.title}</h2>
                  <p className="text-gray-600 mt-2 flex-1">{course.description}</p>
                  <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                    <span>Category: {course.category || "General"}</span>
                    <span className="font-semibold text-primary">${course.price || "Free"}</span>
                  </div>
                  <div className="mt-6 flex gap-3">
                    <Link
                      to={`/course-details/${course.id}`}
                      className="flex-1 bg-primary text-white text-center px-4 py-2 rounded-lg hover:bg-primary-dark transition"
                    >
                      View Course
                    </Link>
                    <Link
                      to={`/course-player/${course.id}`}
                      className="flex-1 border border-primary text-primary text-center px-4 py-2 rounded-lg hover:bg-primary/10 transition"
                    >
                      Preview
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}