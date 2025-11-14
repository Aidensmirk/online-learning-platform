import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Sidebar({
  isOpen,
  onClose,
  links = [],
  user,
  darkMode,
  toggleDarkMode,
  onLogout,
  isDesktop = false,
}) {
  const location = useLocation();

  useEffect(() => {
    if (isDesktop || !isOpen) return;
    const handleKey = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isDesktop, isOpen, onClose]);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    if (isDesktop && isOpen) {
      document.body.classList.add("has-sidebar");
    } else {
      document.body.classList.remove("has-sidebar");
    }
    return () => {
      document.body.classList.remove("has-sidebar");
    };
  }, [isDesktop, isOpen]);

  const themeContainer = darkMode
    ? "bg-gray-900/92 text-gray-100 border-gray-800"
    : "bg-white/92 text-gray-900 border-gray-200/70";

  const themeMutedText = darkMode ? "text-gray-400" : "text-gray-500";
  const avatarInitial =
    user?.display_name?.[0] || user?.username?.[0] || (user ? "U" : "");

  const handleLinkClick = () => {
    if (!isDesktop) {
      onClose();
    }
  };

  const handleLogout = async () => {
    await onLogout();
    if (!isDesktop) {
      onClose();
    }
  };

  const showOverlay = !isDesktop && isOpen;
  const sidebarVisible = isDesktop || isOpen;

  return (
    <>
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${
          showOverlay ? "bg-gray-900/50 backdrop-blur visible opacity-100" : "invisible opacity-0 pointer-events-none"
        }`}
        onClick={!isDesktop ? onClose : undefined}
      />

      <aside
        className={`sidebar fixed inset-y-0 left-0 z-50 w-44 sm:w-48 transform transition-transform duration-300 ${
          sidebarVisible ? "translate-x-0" : "-translate-x-full"
        } ${themeContainer} border-r shadow-xl lg:shadow-none backdrop-blur-xl`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <p className="text-sm uppercase tracking-wide opacity-70">Navigation</p>
            <h2 className="text-xl font-semibold">Quick Access</h2>
          </div>
          {!isDesktop && (
            <button
              onClick={onClose}
              className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
            >
              <span className="sr-only">Close sidebar</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 9.293l4.646-4.647a1 1 0 011.414 1.414L11.414 10l4.646 4.646a1 1 0 01-1.414 1.414L10 11.414l-4.646 4.646a1 1 0 01-1.414-1.414L8.586 10 3.94 5.354a1 1 0 011.414-1.414L10 9.293z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>

        <div className="px-5 py-4 border-b border-white/10">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary text-lg font-semibold uppercase">
                {avatarInitial}
              </span>
              <div>
                <p className="font-semibold">{user.display_name || user.username}</p>
                <p className={`text-xs ${themeMutedText}`}>{user.email}</p>
              </div>
            </div>
          ) : (
            <div>
              <p className="font-semibold text-lg">Welcome!</p>
              <p className={`text-sm ${themeMutedText}`}>Sign in to access more features.</p>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1 custom-scrollbar">
          {links.map((link) => {
            const isCurrent = location.pathname === link.to || location.pathname.startsWith(`${link.to}/`);
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={handleLinkClick}
                className={`sidebar-link ${isCurrent ? "sidebar-link--active" : ""}`}
              >
                {link.icon && <span className="sidebar-link__icon">{link.icon}</span>}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer px-5 pb-5 border-t border-white/10 pt-4">
          <button
            onClick={() => {
              toggleDarkMode();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-white/20 text-sm font-medium hover:bg-white/10 transition"
          >
            <span>Toggle {darkMode ? "Light Mode" : "Dark Mode"}</span>
            <span>{darkMode ? "☀️" : "🌙"}</span>
          </button>
          {user ? (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition text-sm font-semibold"
            >
              <span>Logout</span>
              <span>↩</span>
            </button>
          ) : (
            <div className="flex gap-2">
              <Link
                to="/login"
                onClick={handleLinkClick}
                className="flex-1 text-center px-3 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition text-sm"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={handleLinkClick}
                className="flex-1 text-center px-3 py-2 rounded-lg border border-primary text-primary font-semibold hover:bg-primary/10 transition text-sm"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

