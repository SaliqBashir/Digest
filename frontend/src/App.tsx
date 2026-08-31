import { useState } from "react";
import DataGrid from "./components/DataGrid";
import Input from "./components/Input";
import NavBar from "./components/Navbar";
import UploadView from "./components/UploadView"
import LoginPage from "./components/LoginPage";
import Button from "./components/Button";
function App() {
  const [view, setView] = useState<"home" | "upload">("home");
  const [ isLoggedIn, setIsLoggedIn] = useState(false);
  const [ authMode, setAuthMode] = useState<"login"| "signup">("login");
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
      <NavBar name="Digest" button={view === "home" ? "upload" : "home"}
        onButtonClick={() => setView(view === "home" ? "upload" : "home")}
      />
      {view === "home" ? (
          <>
            <Input placeholder="Search"/>
            <DataGrid />
            <Button onClick={()=>setIsLoggedIn(false)} className="btn-logout">Logout</Button>
          </>
         )
         : (
        <UploadView />
      )
      }
      </>
    )}
    </>
  );
}

export default App;
