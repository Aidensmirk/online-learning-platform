import Navbar from "./Navbar";
import { useTheme } from "../context/ThemeContext";

export default function PageLayout({
  title,
  eyebrow,
  subtitle,
  actions,
  children,
  className = "",
  dense = false,
}) {
  const { darkMode } = useTheme();

  return (
    <>
      <Navbar />
      <section className={`page-layout ${dense ? "page-layout--flush" : ""} ${className}`}>
        {(title || subtitle || actions || eyebrow) && (
          <header className="page-layout__header">
            <div className="page-layout__heading">
              {eyebrow && <span className={`chip ${darkMode ? "" : ""}`}>{eyebrow}</span>}
              {title && <h1>{title}</h1>}
              {subtitle && <p>{subtitle}</p>}
            </div>
            {actions && <div className="page-layout__actions">{actions}</div>}
          </header>
        )}
        <div className="page-layout__content">{children}</div>
      </section>
    </>
  );
}

