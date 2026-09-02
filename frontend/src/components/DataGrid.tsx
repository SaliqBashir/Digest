import { useState, useEffect } from "react";
import FileCard from "./FileCard";
import InfoPopup from "./InfoPopup";
import { getFiles, deleteFile, getFileById, lookupFiles } from "../services/api";
import Toast from "./Toast";

interface DataGridProps {
    searchQuery?: string;
    searchMode?: "id" | "lookup";
}

function DataGrid({ searchQuery, searchMode }: DataGridProps) {
    const [selectedFile, setSelectedFile] = useState<any | null>(null);
    const [files, setFiles] = useState<any[]>([]);
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [toastKey, setToastKey] = useState(0);
    useEffect(()=>{
        const fetchFiles = async () => {
            try{
                let data;
                if (!searchQuery) {
                    data = await getFiles();
                } else if (searchMode === "id") {
                    data = await getFileById(Number(searchQuery));
                    data = [data];
                } else if (searchMode === "lookup") {
                    data = await lookupFiles(searchQuery);
                }
                setFiles(data || []);
            }
            catch(err: any){
                const backendError = err.response?.data?.detail;
                const errorStr = typeof backendError === "string" ? backendError : 
                                 Array.isArray(backendError) ? backendError[0]?.msg : 
                                 "Failed to load files";
                setErrorMessage(errorStr);
                setShowError(true);
                setToastKey(prev => prev + 1);
            }
        };
        fetchFiles();
    }, [searchQuery, searchMode]);

    const handleDelete = async (id: number) => {
        try {
            await deleteFile(id);
            setFiles(prev => prev.filter(f => f.item_id !== id));
            setSelectedFile(null);
        } catch (err: any) {
            const backendError = err.response?.data?.detail;
            const errorStr = typeof backendError === "string" ? backendError : 
                             Array.isArray(backendError) ? backendError[0]?.msg : 
                             "Failed to delete file";
            setErrorMessage(errorStr);
            setShowError(true);
            setToastKey(prev => prev + 1);
        }
    };

    return (
        <>
            {showError && (
                <Toast key={toastKey} onClose={() => setShowError(false)}>
                    {errorMessage}
                </Toast>
            )}
            <div className="file-grid-container">
            <div className="file-grid">
                {(files || []).map((file, index) => (
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
                    onDelete={handleDelete}
                />
            )}
        </div>
        </>
    );
}

export default DataGrid;
