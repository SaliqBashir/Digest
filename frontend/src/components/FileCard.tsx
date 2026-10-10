import Button from "./Button";
import MarqueeText from "./MarqueeText";
import { displayFileName } from "../utils/filename";
import fileAlt from "../assets/file_alt.svg";
import imageAlt from "../assets/image_alt.svg";

interface Props {
  file: any;
  onInfoClick: () => void;
}

function FileCard({ file, onInfoClick }: Props) {
  const fileName = displayFileName(file);
  const extension = fileName.includes(".")
    ? fileName.substring(fileName.lastIndexOf(".")).toLowerCase()
    : "";
  const isImage = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".svg",
    ".bmp",
    ".ico",
  ].includes(extension);

  return (
    <div
      className="file-card"
      onClick={() => {
        if (file.link) {
          window.open(file.link, "_blank", "noopener,noreferrer");
        }
      }}
      style={{ cursor: "pointer" }}
    >
      <div className="file-card-image-container">
        {file.link ? (
          isImage ? (
            <img
              src={file.link}
              alt="thumbnail"
              className="file-thumbnail"
              onError={(e) => {
                e.currentTarget.src = imageAlt;
                e.currentTarget.style.objectFit = "contain";
                e.currentTarget.style.padding = "2rem";
              }}
            />
          ) : (
            <img
              src={fileAlt}
              alt="file icon"
              className="file-thumbnail"
              style={{ objectFit: "contain", padding: "2rem" }}
            />
          )
        ) : (
          <div
            style={{ padding: "1rem", fontSize: "0.8rem", overflow: "hidden" }}
          >
            {file.summary}
          </div>
        )}
      </div>

      <div className="file-card-footer" aria-label={fileName}>
        <MarqueeText text={fileName} />
      </div>
      <Button
        onClick={(e) => {
          e.stopPropagation();
          onInfoClick();
        }}
        className="btn-icon-large"
      >
        I
      </Button>
    </div>
  );
}

export default FileCard;
