import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />
      <section className="min-h-screen bg-gradient-to-r from-primary to-blue-600 py-24 px-4">
        <div className="max-w-6xl mx-auto text-center text-white space-y-12">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
              Empower Your Learning Journey
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-white/90">
              Discover expertly crafted courses, personalized dashboards, and interactive tools that help you
              learn faster and smarter.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/all-courses"
                className="bg-white text-primary px-6 py-3 rounded-lg font-semibold shadow-lg hover:bg-gray-100 transition"
              >
                Browse Courses
              </Link>
              <Link
                to="/register"
                className="bg-primary/20 border border-white/40 px-6 py-3 rounded-lg font-semibold hover:bg-primary/30 transition"
              >
                Join the Community
              </Link>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-3 text-left">
            <div className="bg-white/10 backdrop-blur rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-2">Role-Based Dashboards</h3>
              <p className="text-white/80">
                Students, instructors, and admins get tailored experiences with the tools they need the most.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-2">Interactive Content</h3>
              <p className="text-white/80">
                Engage with video lessons, assignments, quizzes, and discussions in one cohesive experience.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-2">Analytics & Insights</h3>
              <p className="text-white/80">
                Track progress, identify trends, and make data-driven decisions with powerful analytics.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 px-4">
        <div className="max-w-6xl mx-auto grid gap-12 md:grid-cols-2 items-center">
          <img
            src="https://images.unsplash.com/photo-1587613864521-810ee3c9f236?auto=format&fit=crop&w=1200&q=80"
            alt="Students collaborating"
            className="w-full rounded-xl shadow-lg"
          />
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-primary">Learn Anywhere, Anytime</h2>
            <p className="text-gray-600">
              The platform is built for accessibility and responsive design, so you can keep learning whether
              you’re on a laptop, tablet, or phone. Manage lessons, join live sessions, and stay on schedule with smart reminders.
            </p>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 text-primary font-semibold hover:text-primary/80"
            >
              Explore our mission
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-6xl mx-auto text-center space-y-8">
          <h2 className="text-3xl font-bold text-primary">Built for Growth</h2>
          <p className="text-gray-600 max-w-3xl mx-auto">
            We’re building a full LMS experience—from messaging and forums to integrations and advanced analytics.
            Seamless navigation keeps everything within reach, whether you’re exploring new content or managing your classroom.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/login"
              className="bg-primary text-white px-6 py-3 rounded-lg shadow hover:bg-primary-dark transition"
            >
              Sign in and start learning
            </Link>
            <Link
              to="/instructor-dashboard"
              className="border border-primary text-primary px-6 py-3 rounded-lg hover:bg-primary/10 transition"
            >
              Instructor tools
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}