import { useState, useRef } from "react";
import Button from "./Button";

export default function UploadView() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="upload-container">
      {!selectedFile ? (
        <div
          className="upload-dropzone"
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            backgroundColor: isDragging ? "#cccccc" : "var(--bg-secondary)",
            cursor: "pointer"
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          <div className="dropzone-text">Drag and drop the file</div>
          <div className="dropzone-subtext">Max size 50MB</div>
        </div>
      ) : (
        <div className="upload-action-area">
          <div className="file-input-wrapper">
            <input
              type="text"
              className="input-void file-input-display"
              value={`File: ${selectedFile.name}`}
              readOnly
            />
            <div className="upload-cross-wrapper">
              <Button
                onClick={() => setSelectedFile(null)}
                className="btn-icon"
              >
                X
              </Button>
            </div>
          </div>

          <Button
            onClick={() => alert(`Uploading ${selectedFile.name} to the backend...`)}
            className="btn-upload"
          >
            Upload
          </Button>
        </div>
      )}
    </div>
  );
}
