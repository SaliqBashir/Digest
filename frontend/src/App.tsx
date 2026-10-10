import { useState, useEffect, useCallback } from "react";
import DataGrid from "./components/DataGrid";
import Input from "./components/Input";
import NavBar from "./components/Navbar";
import UploadView from "./components/UploadView";
import LoginPage from "./components/LoginPage";
import ProfileView from "./components/ProfileView";
import SortControl from "./components/SortControl";
import type { SortBy } from "./components/SortControl";
import Button from "./components/Button";

function isTokenExpired(token: string): boolean {
  try {
    const segment = token.split(".")[1];
    if (!segment) return true;
    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
    if (typeof payload.exp !== "number") return false;
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

function App() {
  const [view, setView] = useState<"home" | "upload" | "profile">("home");
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const token = localStorage.getItem("token");
    return !!token && !isTokenExpired(token);
  });
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"id" | "lookup">("lookup");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [gridKey, setGridKey] = useState(0);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    setIsLoggedIn(false);
    setView("home");
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && isTokenExpired(token)) {
      localStorage.removeItem("token");
      localStorage.removeItem("email");
    }
    const onExpired = () => setIsLoggedIn(false);
    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, []);

  const handleUploaded = useCallback(() => {
    setSearchQuery("");
    setGridKey((k) => k + 1);
    setView("home");
  }, []);

  return (
    <>
      <div className="noise-overlay"></div>
      <div className="scanline"></div>
      {!isLoggedIn ? (
        <>
          <NavBar
            name="Digest"
            button={authMode === "login" ? "Sign up" : "Login"}
            onButtonClick={() =>
              setAuthMode(authMode === "login" ? "signup" : "login")
            }
          />
          <LoginPage mode={authMode} onLogin={() => setIsLoggedIn(true)} />
        </>
      ) : (
        <>
          <NavBar
            name="Digest"
            button={view === "home" ? "Upload" : "Home"}
            onButtonClick={() =>
              setView(view === "home" ? "upload" : "home")
            }
            showProfile={view !== "profile"}
            onProfileClick={() => setView("profile")}
          />
          {view === "home" ? (
            <>
              <div className="search-row">
                <Input
                  placeholder="Search"
                  onSearch={(query, mode) => {
                    setSearchQuery(query);
                    setSearchMode(mode);
                  }}
                />
                <div className="controls-box">
                  <SortControl sortBy={sortBy} onChange={setSortBy} />
                  <Button onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}>
                    View: {viewMode === "grid" ? "Grid" : "List"}
                  </Button>
                </div>
              </div>
              <DataGrid
                key={gridKey}
                searchQuery={searchQuery}
                searchMode={searchMode}
                sortBy={sortBy}
                viewMode={viewMode}
                onSortChange={setSortBy}
              />
              <Button onClick={logout} className="btn-logout">
                Logout
              </Button>
            </>
          ) : view === "upload" ? (
            <UploadView onUploaded={handleUploaded} />
          ) : (
            <ProfileView />
          )}
        </>
      )}
    </>
  );
}

export default App;
