import React, { useState, useRef, useEffect } from "react";
import Button from "./Button";
import fileAlt from "../assets/file_alt.svg";
import imageAlt from "../assets/image_alt.svg";

interface Props {
  file: any;
  onInfoClick: () => void;
}

function FileCard({ file, onInfoClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [scrollAmount, setScrollAmount] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const fullPath = file.link ? file.link.split('/').pop() || "" : "";
  const fileName = fullPath ? fullPath.substring(fullPath.indexOf('-') + 1) : "Unknown File";
  const extension = fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')).toLowerCase() : "";
  const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'].includes(extension);

  useEffect(() => {
    if (containerRef.current && textRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const textWidth = textRef.current.scrollWidth;
      if (textWidth > containerWidth) {
        setScrollAmount(textWidth - containerWidth + 24);
      } else {
        setScrollAmount(0);
      }
    }
  }, [fileName]);

  return (
    <div
      className="file-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        if (file.link) {
          window.open(file.link, '_blank', 'noopener,noreferrer');
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
          <div style={{ padding: '1rem', fontSize: '0.8rem', overflow: 'hidden' }}>
            {file.summary}
          </div>
        )}
      </div>

      <div
        className="file-card-footer"
        title={fileName}
        ref={containerRef}
      >
        <div
          ref={textRef}
          style={{
            display: "inline-block",
            whiteSpace: "nowrap",
            transition: "transform 2.5s linear",
            transform: isHovered && scrollAmount > 0 ? `translateX(-${scrollAmount}px)` : "translateX(0px)"
          }}
        >
          {fileName}
        </div>
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
  )
}

export default FileCard;
