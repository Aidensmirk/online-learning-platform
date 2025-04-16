import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "../Services/firebase";
import { Link } from "react-router-dom";

export default function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const q = query(
          collection(db, "wishlist"),
          where("studentId", "==", auth.currentUser.uid)
        );
        const snapshot = await getDocs(q);
        const wishlistData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setWishlist(wishlistData);
      } catch (error) {
        console.error("Error fetching wishlist:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-6">My Wishlist</h1>
      {wishlist.length === 0 ? (
        <p>You have no courses in your wishlist.</p>
      ) : (
        <ul className="space-y-4">
          {wishlist.map((item) => (
            <li key={item.id} className="p-4 border rounded shadow">
              <h2 className="text-xl font-bold">{item.courseId}</h2>
              <Link
                to={`/course-details/${item.courseId}`}
                className="text-blue-600 hover:underline"
              >
                View Course
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}