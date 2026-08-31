import { useState } from "react";
import FileCard from "./FileCard";
import InfoPopup from "./InfoPopup";
function DataGrid() {
    const [selectedFile, setSelectedFile] = useState<any | null>(null);
    const mockFiles = [
          { id: "file_123", url: "" },
        { id: "file_456", url: "" },
            { id: "file_123", url: "" },
        { id: "file_456", url: "" },
        { id: "file_789", url: "" },
        { id: "file_012", url: "" },
        { id: "file_123", url: "" },
        { id: "file_456", url: "" },
        { id: "file_789", url: "" },
        { id: "file_012", url: "" },
      { id: "file_789", url: "" },
        { id: "file_012", url: "" },
        { id: "file_123", url: "" },
        { id: "file_456", url: "" },
        { id: "file_789", url: "" },
        { id: "file_012", url: "" },
        { id: "file_123", url: "" },
        { id: "file_456", url: "" },
        { id: "file_789", url: "" },
        { id: "file_012", url: "" },
    ];
    return (
        <div className="file-grid-container">
            <div className="file-grid">
                {mockFiles.map((file, index) => (
                    <FileCard
                        key={index}
                        file={file}
                        onInfoClick={() =>
                            setSelectedFile(file)}
                    />
                ))}
            </div>
            {selectedFile && (
                <InfoPopup
                    file={selectedFile}
                    onClose={() => setSelectedFile(null)}
                />
            )}
        </div>
    );
}

export default DataGrid;
