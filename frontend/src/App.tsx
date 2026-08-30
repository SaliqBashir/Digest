import { useState } from "react";
import DataGrid from "./components/DataGrid";
import Input from "./components/Input";
import NavBar from "./components/Navbar";
import UploadView from "./components/UploadView"
function App() {
  const [view, setView] = useState<"home" | "upload">("home");
  return (
    <>
      <div className="noise-overlay"></div>
      <div className="scanline"></div>
      <NavBar name="Digest" button={view === "home" ? "upload" : "home"}
        onButtonClick={() => setView(view === "home" ? "upload" : "home")}
      />
      {view === "home" ? (
        <>
          <Input />
          <DataGrid />
        </>) : (
        <UploadView />
      )
      }

    </>
  );
}

export default App;
