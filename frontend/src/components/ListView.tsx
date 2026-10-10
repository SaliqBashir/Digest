import Button from "./Button";
import MarqueeText from "./MarqueeText";
import { displayFileName } from "../utils/filename";
import { formatBytes, formatDate } from "../utils/format";
import type { SortBy } from "./SortControl";
import fileAlt from "../assets/file_alt.svg";

interface Props {
  files: any[];
  sortBy: SortBy;
  onSortChange: (sort: SortBy) => void;
  onInfo: (file: any) => void;
}

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".ico"];

function extensionOf(file: any): string {
  const name = displayFileName(file);
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toUpperCase() : "—";
}

function isImage(file: any): boolean {
  const name = displayFileName(file).toLowerCase();
  const dot = name.lastIndexOf(".");
  const ext = dot >= 0 ? name.slice(dot) : "";
  return IMAGE_EXTENSIONS.includes(ext);
}

function sortArrow(active: boolean, dir: "asc" | "desc"): string {
  if (!active) return "";
  return dir === "asc" ? " ↑" : " ↓";
}

function ListView({ files, sortBy, onSortChange, onInfo }: Props) {
  const toggleName = () =>
    onSortChange(sortBy === "name-asc" ? "name-desc" : "name-asc");
  const toggleDate = () =>
    onSortChange(sortBy === "newest" ? "oldest" : "newest");
  const toggleSize = () =>
    onSortChange(sortBy === "size-desc" ? "size-asc" : "size-desc");

  const openFile = (file: any) => {
    if (file.link) window.open(file.link, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="list-scroll">
      <div className="list-inner">
        <div className="list-grid list-header">
          <button type="button" className="list-header-cell" onClick={toggleName}>
            Name
            {sortArrow(sortBy === "name-asc" || sortBy === "name-desc", sortBy === "name-desc" ? "desc" : "asc")}
          </button>
          <button type="button" className="list-header-cell" onClick={() => onSortChange("type")}>
            Type{sortBy === "type" ? " ↓" : ""}
          </button>
          <button type="button" className="list-header-cell" onClick={toggleSize}>
            Size
            {sortArrow(sortBy === "size-asc" || sortBy === "size-desc", sortBy === "size-asc" ? "asc" : "desc")}
          </button>
          <button type="button" className="list-header-cell" onClick={toggleDate}>
            Uploaded
            {sortArrow(sortBy === "newest" || sortBy === "oldest", sortBy === "oldest" ? "asc" : "desc")}
          </button>
          <span />
        </div>
        {files.map((file) => {
          const name = displayFileName(file);
          return (
            <div className="list-grid list-row" key={file.item_id ?? `${file.link}-${file.created_at}`}>
              <div
                className="list-cell-name"
                onClick={() => openFile(file)}
                aria-label={`Open ${name}`}
              >
                <img
                  src={isImage(file) ? file.link : fileAlt}
                  alt=""
                  className="list-thumb"
                  onError={(e) => {
                    e.currentTarget.src = fileAlt;
                  }}
                />
                <MarqueeText text={name} />
              </div>
              <div className="list-cell">{extensionOf(file)}</div>
              <div className="list-cell">{formatBytes(file.file_size)}</div>
              <div className="list-cell">{formatDate(file.created_at)}</div>
              <div className="list-cell-actions">
                <Button
                  className="btn-icon-large list-info-btn"
                  onClick={() => onInfo(file)}
                  aria-label={`Info for ${name}`}
                >
                  I
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ListView;
