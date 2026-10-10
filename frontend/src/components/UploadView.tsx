import { useState, useRef } from "react";
import Button from "./Button";
import MarqueeText from "./MarqueeText";
import { upload } from "../services/api";
import Toast from "./Toast";

const MAX_TEXT_MB = 50;
const MAX_IMAGE_MB = 10;
const TEXT_EXTENSIONS = [".txt", ".md", ".markdown", ".text", ".csv", ".json", ".log"];
const DOCUMENT_EXTENSIONS = [".pdf", ".docx", ".pptx", ".xlsx"];
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
const VIDEO_EXTENSIONS = [".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v"];
const AUDIO_EXTENSIONS = [".mp3", ".wav", ".m4a", ".ogg", ".flac", ".aac", ".wma"];
const UPLOADABLE_HINT =
  "Uploadable types: docs (.txt, .md, .pdf, .docx, .pptx, .xlsx, .csv, .json, .log) and images (.jpg, .png, .gif, .webp)";
const ALLOWED_EXTENSIONS = [...TEXT_EXTENSIONS, ...DOCUMENT_EXTENSIONS, ...IMAGE_EXTENSIONS];
const ACCEPT =
  ".txt,.md,.markdown,.text,.csv,.json,.log,text/plain,text/markdown,text/csv,application/json,.pdf,.docx,.pptx,.xlsx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp";

interface Props {
  onUploaded?: () => void;
}

function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return IMAGE_EXTENSIONS.some((ext) =>
    file.name.toLowerCase().endsWith(ext)
  );
}

function validateFile(file: File): string | null {
  if (file.size === 0) return "File is empty";
  const name = file.name.toLowerCase();
  const isVideoOrAudio =
    file.type.startsWith("video/") ||
    file.type.startsWith("audio/") ||
    VIDEO_EXTENSIONS.some((ext) => name.endsWith(ext)) ||
    AUDIO_EXTENSIONS.some((ext) => name.endsWith(ext));
  if (isVideoOrAudio) {
    return `Video and audio files aren't supported. ${UPLOADABLE_HINT}`;
  }
  const ok = ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
  if (!ok) {
    return `Unsupported file type. ${UPLOADABLE_HINT}`;
  }
  const limitMb = isImageFile(file) ? MAX_IMAGE_MB : MAX_TEXT_MB;
  if (file.size > limitMb * 1024 * 1024) {
    return `File too large. Max ${isImageFile(file) ? "image" : "text"} size is ${limitMb}MB`;
  }
  return null;
}

export default function UploadView({ onUploaded }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastKey, setToastKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setToastKey((prev) => prev + 1);
  };

  const pickFile = (file: File | undefined) => {
    if (!file) return;
    const error = validateFile(file);
    if (error) {
      showMessage(error);
      return;
    }
    setSelectedFile(file);
  };

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
      pickFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      pickFile(e.target.files[0]);
    }
    // Allow re-selecting the same file after a failed validation.
    e.target.value = "";
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!selectedFile || isUploading) return;
    const error = validateFile(selectedFile);
    if (error) {
      showMessage(error);
      return;
    }
    setIsUploading(true);
    try {
      await upload(selectedFile);
      setSelectedFile(null);
      showMessage("File uploaded successfully!");
      onUploaded?.();
    } catch (err: any) {
      const backendError = err.response?.data?.detail;
      const errorStr =
        typeof backendError === "string"
          ? backendError
          : Array.isArray(backendError)
            ? backendError[0]?.msg
            : "Failed to upload file";
      showMessage(errorStr ?? "Failed to upload file");
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
              style={{
                width: "48px",
                height: "48px",
                border: "4px solid var(--text-primary)",
                borderTopColor: "transparent",
              }}
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
              cursor: "pointer",
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept={ACCEPT}
              style={{ display: "none" }}
            />
            <div className="dropzone-text">Drag and drop the file</div>
            <div className="dropzone-subtext">
              Max Upload Size 50MB
            </div>
          </div>
        ) : (
          <div className="upload-action-area">
            <div className="file-input-wrapper">
              <div
                className="input-void file-input-display"
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  cursor: "default",
                }}
              >
                <MarqueeText text={`File: ${selectedFile.name}`} />
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
              disabled={isUploading}
            >
              Upload
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
