import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext({ darkMode: false, toggleDarkMode: () => {} });

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const stored = localStorage.getItem("dark-mode");
      return stored ? JSON.parse(stored) : false;
    } catch (error) {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    try {
      localStorage.setItem("dark-mode", JSON.stringify(darkMode));
    } catch (error) {
      // ignore storage errors
    }
  }, [darkMode]);

  const value = useMemo(
    () => ({
      darkMode,
      toggleDarkMode: () => setDarkMode((prev) => !prev),
      setDarkMode,
    }),
    [darkMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
