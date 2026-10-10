import { useState } from "react";
import Button from "./Button";
import { displayFileName } from "../utils/filename";
import { formatBytes } from "../utils/format";

interface FileModalProps {
  file: any;
  onClose: () => void;
  onDelete: (id: number) => void;
}

function extensionOf(file: any): string {
  const name = displayFileName(file);
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toUpperCase() : "—";
}

function FileModal({ file, onClose, onDelete }: FileModalProps) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const handleCopy = async () => {
    setCopied(false);
    setCopyFailed(false);
    try {
      await navigator.clipboard.writeText(file.link ?? "");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyFailed(true);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="popup-box"
        onClick={(e) => e.stopPropagation()}
        style={{ width: "340px", maxWidth: "92vw" }}
      >
        <div className="popup-header">
          <Button onClick={onClose} className="btn-icon">
            X
          </Button>
        </div>

        <div className="popup-row">id: {file.item_id}</div>

        <div className="popup-row">Type: {extensionOf(file)}</div>

        <div className="popup-row">Size: {formatBytes(file.file_size)}</div>

        <div
          className="popup-row"
          style={{
            whiteSpace: "pre-wrap",
            display: "block",
            padding: "1rem",
            lineHeight: "1.5",
            maxHeight: "220px",
            overflowY: "auto",
          }}
        >
          {file.summary || "No summary available."}
        </div>

        {copyFailed && (
          <div className="popup-row" style={{ fontSize: "0.8rem" }}>
            Copy failed — select the link manually.
          </div>
        )}

        <div
          className="popup-row"
          style={{ justifyContent: "space-between" }}
        >
          <Button onClick={() => onDelete(file.item_id)} className="btn-small">
            Delete
          </Button>
          <Button onClick={handleCopy} className="btn-small">
            {copied ? "Copied!" : "Copy Link"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default FileModal;
