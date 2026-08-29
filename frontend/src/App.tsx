import DataGrid from "./components/DataGrid";
import Input from "./components/Input";
import NavBar from "./components/Navbar";
function App() {
  return (<>
    <div className="noise-overlay"></div>
    <div className="scanline"></div>
    <NavBar name="Digest" button="Upload"/>
    <Input/>
    <DataGrid/>
    </>
    );
}

    export default App;
