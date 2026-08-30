import Button from "./Button";

interface FileModalProps {
  file: any;
  onClose: () => void;
}

function FileModal({ file, onClose }: FileModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="popup-box" 
        onClick={(e) => e.stopPropagation()} 
      >
        <div className="popup-header">
          <Button 
            onClick={onClose}
            style={{
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
        
        <div className="popup-row">
          id: {file.id}
        </div>
        
        <div className="popup-row popup-row-right">
          <Button 
            onClick={() => alert("Link Copied!")}
            style={{
              padding: "0.25rem 0.5rem",
              textTransform: "uppercase",
              boxShadow: "2px 2px 0px 0px #000000"
            }}
          >
            Copy Link
          </Button>
        </div>
        
        <div className="popup-row">
          <Button 
            onClick={() => alert("File Deleted!")}
            style={{
              padding: "0.25rem 0.5rem",
              textTransform: "uppercase",
              boxShadow: "2px 2px 0px 0px #000000"
            }}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

export default FileModal;
