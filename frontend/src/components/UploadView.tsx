import { useState, useRef, useEffect } from "react";
import Button from "./Button";
import { upload } from "../services/api";
import Toast from "./Toast";

export default function UploadView() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastKey, setToastKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [scrollAmount, setScrollAmount] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (selectedFile && containerRef.current && textRef.current) {
      const computedStyle = window.getComputedStyle(containerRef.current);
      const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
      const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
      
      const availableWidth = containerRef.current.clientWidth - paddingLeft - paddingRight;
      const textWidth = textRef.current.scrollWidth;
      
      if (textWidth > availableWidth) {
        setScrollAmount(textWidth - availableWidth + 24);
      } else {
        setScrollAmount(0);
      }
    }
  }, [selectedFile]);

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

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    try {
      await upload(selectedFile);
      setToastMessage("File uploaded successfully!");
      setShowToast(true);
      setToastKey(prev => prev + 1);
      setSelectedFile(null);
    } catch (err: any) {
      const backendError = err.response?.data?.detail;
      const errorStr = typeof backendError === "string" ? backendError : 
                       Array.isArray(backendError) ? backendError[0]?.msg : 
                       "Failed to upload file";
      setToastMessage(errorStr);
      setShowToast(true);
      setToastKey(prev => prev + 1);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      {showToast && (
        <Toast key={toastKey} onClose={() => setShowToast(false)}>
          {toastMessage}
        </Toast>
      )}
      <div className="upload-container">
        {isUploading ? (
          <div className="upload-progress-area">
            <div 
              style={{ width: '48px', height: '48px', border: '4px solid var(--text-primary)', borderTopColor: 'transparent' }} 
              className="upload-spinner"
            ></div>
            <div className="upload-text">UPLOADING...</div>
          </div>
        ) : !selectedFile ? (
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
            <div
              className="input-void file-input-display"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              style={{ position: "relative", display: "flex", alignItems: "center", cursor: "default" }}
            >
              <div 
                ref={containerRef}
                style={{ overflow: "hidden", width: "100%" }}
              >
                <div
                ref={textRef}
                style={{
                  display: "inline-block",
                  whiteSpace: "nowrap",
                  transition: "transform 2.5s linear",
                  transform: isHovered && scrollAmount > 0 ? `translateX(-${scrollAmount}px)` : "translateX(0px)"
                }}
              >
                File: {selectedFile.name}
              </div>
            </div>
            </div>
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
            onClick={handleUpload}
            className="btn-upload"
          >
            Upload
          </Button>
        </div>
      )}
    </div>
    </>
  );
}
