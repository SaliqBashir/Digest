import { useState, useEffect } from "react";
import FileCard from "./FileCard";
import InfoPopup from "./InfoPopup";
import ListView from "./ListView";
import { displayFileName } from "../utils/filename";
import type { SortBy } from "./SortControl";
import { getFiles, deleteFile, getFileById, lookupFiles } from "../services/api";
import Toast from "./Toast";

interface DataGridProps {
  searchQuery?: string;
  searchMode?: "id" | "lookup";
  sortBy?: SortBy;
  viewMode?: "grid" | "list";
  onSortChange?: (sort: SortBy) => void;
}

function formatError(err: any, fallback: string): string {
  const backendError = err.response?.data?.detail;
  if (typeof backendError === "string") return backendError;
  if (Array.isArray(backendError)) return backendError[0]?.msg ?? fallback;
  return fallback;
}

function extensionOf(file: any): string {
  const name = displayFileName(file);
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
}

function sortFiles(files: any[], sortBy: SortBy): any[] {
  const arr = [...files];
  switch (sortBy) {
    case "name-asc":
      return arr.sort((a, b) =>
        displayFileName(a).toLowerCase().localeCompare(displayFileName(b).toLowerCase())
      );
    case "name-desc":
      return arr.sort((a, b) =>
        displayFileName(b).toLowerCase().localeCompare(displayFileName(a).toLowerCase())
      );
    case "type":
      return arr.sort((a, b) => {
        const ext = extensionOf(a).localeCompare(extensionOf(b));
        if (ext !== 0) return ext;
        return displayFileName(a).toLowerCase().localeCompare(displayFileName(b).toLowerCase());
      });
    case "oldest":
      return arr.sort(
        (a, b) =>
          new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()
      );
    case "size-desc":
      return arr.sort((a, b) => (b.file_size ?? -1) - (a.file_size ?? -1));
    case "size-asc":
      return arr.sort(
        (a, b) => (a.file_size ?? Number.MAX_SAFE_INTEGER) - (b.file_size ?? Number.MAX_SAFE_INTEGER)
      );
    case "newest":
    default:
      return arr.sort(
        (a, b) =>
          new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
      );
  }
}

function DataGrid({ searchQuery, searchMode, sortBy = "newest", viewMode = "grid", onSortChange }: DataGridProps) {
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [toastKey, setToastKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fetchFiles = async () => {
      setIsLoading(true);
      try {
        const query = (searchQuery ?? "").trim();
        let data: any;
        if (!query) {
          data = await getFiles();
        } else if (searchMode === "id") {
          if (!/^\d+$/.test(query)) {
            throw { response: { data: { detail: "Search by ID requires a number" } } };
          }
          data = await getFileById(Number(query));
          data = [data];
        } else {
          data = await lookupFiles(query);
          // Backend returns a single object; normalize to a list.
          data = Array.isArray(data) ? data : [data];
        }
        if (!cancelled) {
          setFiles(Array.isArray(data) ? data : [data].filter(Boolean));
          setShowError(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setFiles([]);
          setErrorMessage(formatError(err, "Failed to load files"));
          setShowError(true);
          setToastKey((prev) => prev + 1);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchFiles();
    return () => {
      cancelled = true;
    };
  }, [searchQuery, searchMode]);

  const handleDelete = async (id: number) => {
    try {
      await deleteFile(id);
      setFiles((prev) => prev.filter((f) => f.item_id !== id));
      setSelectedFile(null);
    } catch (err: any) {
      setErrorMessage(formatError(err, "Failed to delete file"));
      setShowError(true);
      setToastKey((prev) => prev + 1);
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
        {isLoading ? (
          <div className="upload-text">LOADING...</div>
        ) : files.length === 0 ? (
          <div className="upload-text">
            {searchQuery ? "No files found" : "No files yet — upload one to get started"}
          </div>
        ) : viewMode === "list" ? (
          <ListView
            files={sortFiles(files, sortBy)}
            sortBy={sortBy}
            onSortChange={onSortChange ?? (() => {})}
            onInfo={(file) => setSelectedFile(file)}
          />
        ) : (
          <div className="file-grid">
            {sortFiles(files, sortBy).map((file) => (
              <FileCard
                key={file.item_id ?? `${file.link}-${file.created_at}`}
                file={file}
                onInfoClick={() => setSelectedFile(file)}
              />
            ))}
          </div>
        )}
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
