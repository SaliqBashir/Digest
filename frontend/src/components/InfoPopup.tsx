import Button from "./Button";

interface FileModalProps {
  file: any;
  onClose: () => void;
  onDelete: (id: number) => void;
}

function FileModal({ file, onClose, onDelete }: FileModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="popup-box"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="popup-header">
          <Button
            onClick={onClose}
            className="btn-icon"
          >
            X
          </Button>
        </div>

        <div className="popup-row">
          id: {file.item_id}
        </div>

                <div 
          className="popup-row" 
          style={{ 
            whiteSpace: "pre-wrap", 
            display: "block", 
            padding: "1rem", 
            lineHeight: "1.5", 
            maxHeight: "350px", 
            overflowY: "auto",
            fontSize: "0.85rem",
            fontWeight: "normal"
          }}
        >
        {file.summary}
        </div>

        <div className="popup-row popup-row-right">
          <Button
            onClick={() => {
              navigator.clipboard.writeText(file.link);
              alert("Link Copied!");
            }}
            className="btn-small"
          >
            Copy Link
          </Button>
        </div>

        <div className="popup-row">
          <Button
            onClick={() => onDelete(file.item_id)}
            className="btn-small"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

export default FileModal;
