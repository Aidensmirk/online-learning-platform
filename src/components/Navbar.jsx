import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function Navbar({ className = "" }) {
  const [darkMode, setDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <nav className={`sticky top-0 z-50 bg-primary text-white shadow-md ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="text-xl font-bold">
            <Link to="/" className="hover:text-accent">E-Learning Platform</Link>
          </div>
          <div className="hidden md:flex space-x-6">
            <Link to="/student-dashboard" className="hover:text-accent">Dashboard</Link>
            <Link to="/my-courses" className="hover:text-accent">My Courses</Link>
            <Link to="/profile" className="hover:text-accent">Profile</Link>
            <Link to="/wishlist" className="hover:text-accent">Wishlist</Link>
          </div>
          <button
            className="md:hidden text-white focus:outline-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
              />
            </svg>
          </button>
          <button onClick={() => setDarkMode(!darkMode)} className="bg-gray-800 text-white px-4 py-2 rounded">
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden bg-primary text-white">
          <Link to="/student-dashboard" className="block px-4 py-2 hover:bg-primary-dark">Dashboard</Link>
          <Link to="/my-courses" className="block px-4 py-2 hover:bg-primary-dark">My Courses</Link>
          <Link to="/profile" className="block px-4 py-2 hover:bg-primary-dark">Profile</Link>
          <Link to="/wishlist" className="block px-4 py-2 hover:bg-primary-dark">Wishlist</Link>
        </div>
      )}
    </nav>
  );
}