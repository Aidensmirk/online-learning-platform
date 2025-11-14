import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200">
      <nav className="bg-primary text-white p-4 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-xl font-bold flex items-center">
            <span className="text-accent mr-2">📚</span>
            E-Learning Platform
          </Link>
          <div className="flex space-x-6">
            <Link to="/all-courses" className="hover:text-accent transition duration-300">
              Courses
            </Link>
            <Link to="/about" className="hover:text-accent transition duration-300">
              About
            </Link>
            <Link to="/login" className="hover:text-accent transition duration-300">
              Contact
            </Link>
          </div>
          <div className="flex space-x-4">
            <Link
              to="/login"
              className="bg-accent text-white px-4 py-2 rounded hover:bg-accent-dark transition duration-300"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="bg-secondary text-white px-4 py-2 rounded hover:bg-secondary-dark transition duration-300"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-8 py-16">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-4xl font-bold text-primary mb-6">About Us</h1>
          
          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-2xl font-semibold text-primary mb-3">Welcome to E-Learning Platform</h2>
              <p className="text-lg leading-relaxed">
                We are dedicated to providing high-quality online education to learners worldwide. 
                Our platform offers a wide range of courses designed to help you learn new skills, 
                advance your career, and achieve your goals.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-3">Our Mission</h2>
              <p className="text-lg leading-relaxed">
                Our mission is to make quality education accessible to everyone, everywhere. 
                We believe that learning should be flexible, engaging, and tailored to your needs.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-3">What We Offer</h2>
              <ul className="list-disc list-inside space-y-2 text-lg">
                <li>Expertly curated courses across multiple disciplines</li>
                <li>Interactive learning experiences with video content</li>
                <li>Progress tracking and certificates of completion</li>
                <li>Flexible learning schedules that fit your lifestyle</li>
                <li>Supportive community of learners and instructors</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-3">For Instructors</h2>
              <p className="text-lg leading-relaxed">
                Are you an expert in your field? Join our platform as an instructor and share 
                your knowledge with thousands of eager learners. Create and manage your courses, 
                track student progress, and build your teaching reputation.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-3">Get Started</h2>
              <p className="text-lg leading-relaxed mb-4">
                Ready to start your learning journey? Browse our courses or create an account 
                to get personalized recommendations.
              </p>
              <div className="flex space-x-4">
                <Link
                  to="/all-courses"
                  className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition duration-300"
                >
                  Browse Courses
                </Link>
                <Link
                  to="/register"
                  className="bg-secondary text-white px-6 py-3 rounded-lg hover:bg-secondary-dark transition duration-300"
                >
                  Sign Up Now
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

