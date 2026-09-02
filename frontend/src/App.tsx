import { useState, useEffect } from "react";
import DataGrid from "./components/DataGrid";
import Input from "./components/Input";
import NavBar from "./components/Navbar";
import UploadView from "./components/UploadView"
import LoginPage from "./components/LoginPage";
import ProfileView from "./components/ProfileView";
import Button from "./components/Button";
function App() {
  const [view, setView] = useState<"home" | "upload" | "profile">("home");
  const [ isLoggedIn, setIsLoggedIn] = useState(false);
  const [ authMode, setAuthMode] = useState<"login"| "signup">("login");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"id" | "lookup">("id");

  useEffect(() => {
    if (localStorage.getItem("token")) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <>
      <div className="noise-overlay"></div>
      <div className="scanline"></div>
      {!isLoggedIn ? (
      <>
      <NavBar name="Digest" button={authMode === "login" ? "Sign up" : "Login"} onButtonClick={()=> setAuthMode(authMode === "login" ? "signup" : "login")}
      />
      <LoginPage mode={authMode} onLogin={() => setIsLoggedIn(true)}/>
      </>
      ): (
      <>
      <NavBar 
        name="Digest" 
        button={view === "home" ? "Upload" : "Home"}
        onButtonClick={() => setView(view === "home" ? "upload" : "home")}
        showProfile={view === "home"}
        onProfileClick={() => setView("profile")}
      />
      {view === "home" ? (
          <>
            <Input 
              placeholder="Search" 
              onSearch={(query, mode) => {
                setSearchQuery(query);
                setSearchMode(mode);
              }}
            />
            <DataGrid searchQuery={searchQuery} searchMode={searchMode} />
            <Button 
              onClick={() => {
                localStorage.removeItem("token");
                setIsLoggedIn(false);
              }} 
              className="btn-logout"
            >
              Logout
            </Button>
          </>
         )
         : view === "upload" ? (
        <UploadView />
      ) : (
        <ProfileView />
      )}
      </>
    )}
    </>
  );
}

export default App;
