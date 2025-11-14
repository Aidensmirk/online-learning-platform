import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { getCurrentUser, logOut } from "../Services/authService";
import Sidebar from "./Sidebar";

const BASE_LINKS = [
  { label: "Home", to: "/" },
  { label: "Courses", to: "/all-courses" },
  { label: "About", to: "/about" },
];

const COMMON_LINKS = [{ label: "Messages", to: "/messages" }];

const ROLE_LINKS = {
  student: [
    { label: "Dashboard", to: "/student-dashboard" },
    { label: "My Courses", to: "/my-courses" },
    { label: "Wishlist", to: "/wishlist" },
  ],
  instructor: [
    { label: "Instructor", to: "/instructor-dashboard" },
    { label: "Manage Courses", to: "/manage-courses" },
    { label: "Create Course", to: "/create-course" },
    { label: "Analytics", to: "/instructor-analytics" },
  ],
  admin: [
    { label: "Instructor", to: "/instructor-dashboard" },
    { label: "Manage Courses", to: "/manage-courses" },
    { label: "Create Course", to: "/create-course" },
    { label: "Admin Analytics", to: "/admin-analytics" },
  ],
};

const dedupeLinks = (links) => {
  const seen = new Set();
  return links.filter((link) => {
    if (seen.has(link.to)) {
      return false;
    }
    seen.add(link.to);
    return true;
  });
};

export default function Navbar({ className = "" }) {
  const { darkMode, toggleDarkMode } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const getDesktopMatch = () => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(min-width: 1024px)").matches;
  };

  const [isDesktop, setIsDesktop] = useState(getDesktopMatch);
  const [isSidebarOpen, setIsSidebarOpen] = useState(getDesktopMatch);
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      return null;
    }
  });

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const syncUser = async () => {
      try {
        const current = await getCurrentUser();
        if (isMounted) {
          setUser(current || null);
        }
      } catch (error) {
        if (isMounted) {
          setUser(null);
        }
      }
    };
    syncUser();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const handleChange = (event) => {
      setIsDesktop(event.matches);
      setIsSidebarOpen((prev) => (event.matches ? true : prev));
    };
    handleChange(mediaQuery);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const normalizedRole = useMemo(
    () => (user?.role ? String(user.role).toLowerCase().trim() : ""),
    [user?.role]
  );

  const topLinks = useMemo(() => BASE_LINKS.map(({ label, to }) => ({ label, to })), []);

  const roleSpecificLinks = useMemo(() => {
    if (!normalizedRole) return [];
    if (normalizedRole === "admin") {
      return dedupeLinks([
        ...ROLE_LINKS.instructor,
        ...ROLE_LINKS.student,
        ...ROLE_LINKS.admin,
      ]);
    }
    if (normalizedRole === "instructor") {
      return ROLE_LINKS.instructor;
    }
    if (normalizedRole === "student") {
      return ROLE_LINKS.student;
    }
    return [];
  }, [normalizedRole]);

  const sidebarLinks = useMemo(() => {
    const combined = [
      ...BASE_LINKS,
      ...(user ? COMMON_LINKS : []),
      ...roleSpecificLinks,
    ];
    return dedupeLinks(combined);
  }, [roleSpecificLinks, user?.id]);

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const logOutAndCleanup = async () => {
    await logOut();
    setUser(null);
    setIsMenuOpen(false);
    setIsSidebarOpen(false);
    navigate("/login");
  };

  const handleLogout = async () => {
    try {
      await logOutAndCleanup();
    } catch (error) {
      console.error("Error logging out", error);
    }
  };

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const toggleSidebar = () => {
    if (isDesktop) return;
    setIsSidebarOpen((prev) => !prev);
  };
  const closeSidebar = () => {
    if (!isDesktop) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <>
      <header className={`sticky top-0 z-50 bg-primary text-white shadow-md ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              {user && !isDesktop && (
                <button
                  onClick={toggleSidebar}
                  className="hidden md:flex items-center justify-center h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 transition"
                >
                  <span className="sr-only">Toggle sidebar</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M3 5h14a1 1 0 100-2H3a1 1 0 100 2zm0 6h14a1 1 0 100-2H3a1 1 0 100 2zm0 6h14a1 1 0 100-2H3a1 1 0 100 2z" />
                  </svg>
                </button>
              )}
              <Link to="/" className="text-xl font-bold flex items-center gap-2">
                <span aria-hidden className="text-2xl">📚</span>
                <span className="tracking-tight">E-Learn</span>
              </Link>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              {topLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-sm font-medium transition-colors duration-200 ${
                    isActive(link.to) ? "text-accent" : "text-white hover:text-accent"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={toggleDarkMode}
                className="px-3 py-1.5 rounded-lg border border-white/20 text-sm hover:bg-white/10 transition"
              >
                {darkMode ? "Light Mode" : "Dark Mode"}
              </button>

              {user ? (
                <div className="flex items-center gap-3">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-white/20 transition"
                  >
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent text-primary font-semibold uppercase">
                      {user.display_name?.[0] || user.username?.[0] || "U"}
                    </span>
                    {user.display_name || user.username}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-sm font-medium hover:text-accent transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-sm font-medium">
                  <Link to="/login" className="hover:text-accent transition-colors">
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-white text-primary px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 md:hidden">
              {user && (
                <button
                  onClick={toggleSidebar}
                  className="flex items-center justify-center h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 transition"
                >
                  <span className="sr-only">Open sidebar</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M3 5h14a1 1 0 100-2H3a1 1 0 100 2zm0 6h14a1 1 0 100-2H3a1 1 0 100 2zm0 6h14a1 1 0 100-2H3a1 1 0 100 2z" />
                  </svg>
                </button>
              )}
              <button className="text-white" onClick={toggleMenu}>
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-primary border-t border-white/10">
            <div className="px-4 py-4 space-y-2">
              {topLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive(link.to) ? "bg-white/10 text-accent" : "text-white hover:bg-white/10"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex items-center justify-between border-t border-white/10 pt-3 mt-3">
                <button
                  onClick={toggleDarkMode}
                  className="px-3 py-2 w-full text-left rounded-md text-sm font-medium text-white hover:bg-white/10"
                >
                  {darkMode ? "Switch to Light" : "Switch to Dark"}
                </button>
              </div>
              <div className="border-t border-white/10 pt-3 mt-3 flex flex-col gap-2">
                {user ? (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="text-sm text-white hover:text-accent"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="text-left text-sm text-white hover:text-accent"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="text-white hover:text-accent"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMenuOpen(false)}
                      className="text-white hover:text-accent"
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        links={sidebarLinks}
        user={user}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        onLogout={logOutAndCleanup}
        isDesktop={isDesktop}
      />
    </>
  );
}
