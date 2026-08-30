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
          <button className="btn-close" onClick={onClose}>X</button>
        </div>
        
        <div className="popup-row">
          id: {file.id}
        </div>
        
        <div className="popup-row popup-row-right">
          <button className="btn-mini" onClick={() => alert("Link Copied!")}>
            Copy Link
          </button>
        </div>
        
        <div className="popup-row">
          <button className="btn-mini" onClick={() => alert("File Deleted!")}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default FileModal;
