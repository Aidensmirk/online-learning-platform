import { Link } from "react-router-dom";

export default function Home() {
  return (
    <>

      <nav className="bg-primary text-white p-4 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-xl font-bold flex items-center">
            <span className="text-accent mr-2">📚</span>
            E-Learning Platform
          </Link>
          <div className="flex space-x-6">
            <Link to="/login" className="hover:text-accent transition duration-300">
              Courses
            </Link>
            <Link to="/login" className="hover:text-accent transition duration-300">
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
              className="bg-white text-primary px-4 py-2 rounded hover:bg-gray-100 transition duration-300"
            >
              Register
            </Link>
          </div>
        </div>
      </nav>
      <section className="min-h-screen bg-gradient-to-r from-primary to-blue-600 py-24 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between space-y-12 md:space-y-0">
          <div className="text-center md:text-left md:w-1/2">
            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight animate-fade-in">
              Welcome to <span className="text-accent">E-Learning</span>
            </h1>
            <p className="text-lg md:text-xl mb-8 text-white">
              Unlock your potential with our expertly curated courses. Learn new skills, grow your career, and achieve your goals.
            </p>
            <div className="flex justify-center md:justify-start space-x-4">
              <Link
                to="/login"
                className="bg-white text-primary px-6 py-3 rounded border border-white hover:bg-gray-100 transition duration-300"
              >
                Browse All Courses
              </Link>
              <Link
                to="/login"
                className="bg-white text-primary px-8 py-3 rounded-lg shadow-lg font-semibold transition duration-300 hover:bg-gray-100"
              >
                Get Started
              </Link>
            </div>
            <div className="mt-8 text-sm text-gray-300">
              Join over 10,000+ students learning online
            </div>
          </div>

          <div className="md:w-1/2 flex justify-center">
            <img
              src="src/assets/book-transparent-background-23.webp"
              alt="Learning Illustration"
              className="w-3/4 max-w-md animate-float"
            />
          </div>
        </div>
      </section>


      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-primary">
            Featured Courses
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

            <div className="bg-white rounded-xl shadow-lg p-6 transition hover:shadow-xl transform hover:translate-y-1">
              <img
                src="src/assets/undraw_code-typing_laf4.svg"
                alt="Course 1"
                className="w-full h-48 object-cover rounded-xl mb-4"
              />
              <div className="flex items-center mb-4">
                <img
                  src="src/assets/undraw_young-man-avatar_wgbd.svg"
                  alt="Instructor"
                  className="w-10 h-10 rounded-full mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Aiden Smirk</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-primary">Web Development Masterclass</h3>
              <p className="text-gray-600 mb-4">Learn HTML, CSS, JavaScript and build responsive websites from scratch.</p>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-primary">$49.99</span>
                <Link
                  to="/login"
                  className="bg-primary text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-primary-dark"
                >
                  Enroll Now
                </Link>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 transition hover:shadow-xl transform hover:translate-y-1">
              <img
                src="src/assets/undraw_dev-focus_dd7i.svg"
                alt="Course 2"
                className="w-full h-48 object-cover rounded-xl mb-4"
              />
              <div className="flex items-center mb-4">
                <img
                  src="src/assets/undraw_young-man-avatar_wgbd.svg"
                  alt="Instructor"
                  className="w-10 h-10 rounded-full mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Naseem Suleiman</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-primary">Data Science Fundamentals</h3>
              <p className="text-gray-600 mb-4">Master data analysis, visualization, and machine learning basics.</p>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-primary">$59.99</span>
                <Link
                  to="/login"
                  className="bg-primary text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-primary-dark"
                >
                  Enroll Now
                </Link>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 transition hover:shadow-xl transform hover:translate-y-1">
              <img
                src="src/assets/undraw_hacker-mind_j91b.svg"
                alt="Course 3"
                className="w-full h-48 object-cover rounded-xl mb-4"
              />
              <div className="flex items-center mb-4">
                <img
                  src="src/assets/undraw_young-man-avatar_wgbd.svg"
                  alt="Instructor"
                  className="w-10 h-10 rounded-full mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Sam</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-primary">UI/UX Design Essentials</h3>
              <p className="text-gray-600 mb-4">Learn user-centered design principles and create intuitive interfaces.</p>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-primary">$44.99</span>
                <Link
                  to="/login"
                  className="bg-primary text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-primary-dark"
                >
                  Enroll Now
                </Link>
              </div>
            </div>
          </div>
          <div className="text-center mt-12">
            <Link
              to="/login"
              className="bg-primary text-white px-8 py-3 rounded-lg shadow-lg font-semibold transition duration-300 hover:bg-primary-dark"
            >
              View All Courses
            </Link>
          </div>
          </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-primary">
            Why Choose Our Platform?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-blue-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path
                    fillRule="evenodd"
                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-primary">Expert Instructors</h3>
              <p className="text-gray-600">Learn from industry professionals with years of experience.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-primary">Flexible Learning</h3>
              <p className="text-gray-600">Study at your own pace, anytime and anywhere.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-yellow-100 flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-yellow-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.352-.484.063-.869.588-.869h3.462a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-primary">Community Support</h3>
              <p className="text-gray-600">Join a community of learners and get help when you need it.</p>
            </div>
          </div>
        </div>
      </section>


      <section className="py-20 bg-gradient-to-r from-primary to-blue-600 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Our Achievements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6">
              <div className="text-5xl font-bold mb-2">10,000+</div>
              <div className="text-xl">Students</div>
            </div>
            <div className="text-center p-6">
              <div className="text-5xl font-bold mb-2">500+ </div>
            <div className="text-xl">Courses</div>
          </div>
          <div className="text-center p-6">
            <div className="text-5xl font-bold mb-2">100+</div>
            <div className="text-xl">Instructors</div>
          </div>
          <div className="text-center p-6">
            <div className="text-5xl font-bold mb-2">98%</div>
            <div className="text-xl">Satisfaction Rate</div>
          </div>
        </div>
        </div>
      </section >



        <section className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12 text-primary">
              Our Top Instructors
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <img
                  src="src/assets/undraw_young-man-avatar_wgbd.svg"
                  alt="Instructor 1"
                  className="w-32 h-32 rounded-full mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2 text-primary">Aiden Smirk</h3>
                <p className="text-gray-600 mb-2">Web Development</p>
                <p className="text-sm text-gray-500">10+ years of experience</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <img
                  src="src/assets/undraw_young-man-avatar_wgbd.svg"
                  alt="Instructor 2"
                  className="w-32 h-32 rounded-full mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2 text-primary">Naseem Suleiman</h3>
                <p className="text-gray-600 mb-2">Data Science</p>
                <p className="text-sm text-gray-500">PhD in Computer Science</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <img
                  src="src/assets/undraw_young-man-avatar_wgbd.svg"
                  alt="Instructor 3"
                  className="w-32 h-32 rounded-full mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2 text-primary">Sam Gichuru</h3>
                <p className="text-gray-600 mb-2">UI/UX Design</p>
                <p className="text-sm text-gray-500">Award-winning designer</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <img
                  src="src/assets/undraw_young-man-avatar_wgbd.svg"
                  alt="Instructor 4"
                  className="w-32 h-32 rounded-full mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2 text-primary">Serena Williams</h3>
                <p className="text-gray-600 mb-2">Business & Marketing</p>
                <p className="text-sm text-gray-500">MBA from Harvard</p>
              </div>
            </div>
          </div>
        </section>
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12 text-primary">
              What Our Students Say
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-gray-50 rounded-xl p-6">
                <p className="text-gray-600 mb-4">
                  "The courses are incredibly well-structured and the instructors are very knowledgeable. I've learned so much in just a few weeks!"
                </p>
                <div className="flex items-center">
                  <img
                    src="src/assets/man-png-element-transparent-background_53876-958976 (1).webp"
                    alt="Student 1"
                    className="w-10 h-10 rounded-full mr-3" />
                  <div>
                    <h4 className="font-bold text-primary">Sam Smith</h4>
                    <p className="text-sm text-gray-500">Web Development Student</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-6">
                <p className="text-gray-600 mb-4">
                  "I was able to switch careers thanks to this platform. The practical projects really helped me build my portfolio."
                </p>
                <div className="flex items-center">
                  <img
                    src="src/assets/worldface-american-man-white-background_53876-31194.webp"
                    alt="Student 2"
                    className="w-10 h-10 rounded-full mr-3" />
                  <div>
                    <h4 className="font-bold text-primary">Ken Musya</h4>
                    <p className="text-sm text-gray-500">Data Science Student</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-6">
                <p className="text-gray-600 mb-4">
                  "The flexibility of learning at my own pace was perfect for balancing work and study. Highly recommend!"
                </p>
                <div className="flex items-center">
                  <img
                    src="src/assets/close-up-portrait-serious-man-with-curly-hair_176532-7988.webp"
                    alt="Student 3"
                    className="w-10 h-10 rounded-full mr-3" />
                  <div>
                    <h4 className="font-bold text-primary">Lee Kang-In</h4>
                    <p className="text-sm text-gray-500">UI/UX Design Student</p>
                  </div>
                </div>
              </div>
            </div >
            </div>
          </section >

    {/* Call to Action Section */ }
    < section className = "py-20 bg-gradient-to-r from-primary to-blue-600 text-white" >
      <div className="max-w-6xl mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-8">Ready to Start Learning?</h2>
        <p className="text-xl mb-12 max-w-3xl mx-auto">
          Join thousands of students who have transformed their careers with our courses.
        </p>
        <Link
          to="/login"
          className="bg-white text-primary px-8 py-3 rounded-lg shadow-lg font-semibold transition duration-300 hover:bg-gray-100"
        >
          Get Started for Free
        </Link>
      </div>
      </section >
    </>
  );
}