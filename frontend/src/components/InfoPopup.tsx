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
            className="btn-icon"
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
            className="btn-small"
          >
            Copy Link
          </Button>
        </div>
        
        <div className="popup-row">
          <Button 
            onClick={() => alert("File Deleted!")}
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
