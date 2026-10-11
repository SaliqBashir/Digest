import logo from "../assets/favicon.svg";
import Button from "./Button";
import type { Theme } from "../hooks/useTheme";
interface Props {
  name: string;
  button: string;
  onButtonClick: () => void;
  showProfile?: boolean;
  onProfileClick?: () => void;
  theme: Theme;
  onThemeToggle: () => void;
}
function NavBar({ name, button, onButtonClick, showProfile, onProfileClick, theme, onThemeToggle }: Props) {
  const isDark = theme === "dark";
  return (
    <>
      <nav className="navbar">
        <div className="navbar-left">
          <img
            src={logo}
            alt="Digest Logo"
            className="navbar-logo"
          />
          <h1 className="navbar-heading">{name}</h1>
        </div>
        <div className="navbar-actions">
          <Button
            onClick={onThemeToggle}
            className="theme-toggle"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </Button>
          <Button onClick={onButtonClick}>{button}</Button>
          {showProfile && (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              onClick={onProfileClick}
              className="navbar-profile-icon"
              role="button"
              aria-label="Profile"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          )}
        </div>
      </nav>
    </>
  );
}

export default NavBar;
