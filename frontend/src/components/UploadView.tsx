import { useState } from "react";
import Button from "./Button";

export default function UploadView() {
  // null means no file is selected -> show dropzone
  // A string means a file is selected -> show confirmation
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  return (
    <div className="upload-container">
      {!selectedFile ? (
        // STATE 1: Dropzone
        <div 
          className="upload-dropzone" 
          onClick={() => setSelectedFile("xyz.txt")} // Mocking a file drop on click
          style={{ cursor: "pointer" }}
        >
          <div className="dropzone-text">Drag and drop the file</div>
          <div className="dropzone-subtext">Max size 50MB</div>
        </div>
      ) : (
        // STATE 2: Confirmation
        <div className="upload-action-area">
          <div className="file-input-wrapper">
            <input 
              type="text" 
              className="input-void" 
              value={`File: ${selectedFile}`} 
              readOnly 
              style={{ color: "#888888", width: "300px", paddingRight: "3rem" }}
            />
            <Button 
              onClick={() => setSelectedFile(null)} // Clears the file
              style={{
                position: "absolute",
                right: "0.5rem",
                top: "50%",
                transform: "translateY(-50%)",
                width: "1.5rem",
                height: "1.5rem",
                padding: 0,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                boxShadow: "2px 2px 0px 0px #000000"
              }}
            >
              X
            </Button>
          </div>
          
          <Button 
            onClick={() => alert('Uploading...')}
            style={{ marginTop: "2rem", width: "120px" }}
          >
            Upload
          </Button>
        </div>
      )}
    </div>
  );
}
