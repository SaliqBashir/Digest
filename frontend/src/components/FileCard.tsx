import Button from "./Button";

interface Props {
    file: any;
    onInfoClick: () => void;
}

function FileCard({ file, onInfoClick }: Props) {
    return (
        <div className="file-card">
            {
                file.url && <img src={file.url}
                    alt="thumbnail" className="file-thumbnail" />
            
            }
            <Button 
                onClick={onInfoClick}
                style={{
                    position: "absolute",
                    top: "1rem",
                    right: "1rem",
                    width: "2rem",
                    height: "2rem",
                    padding: 0,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 2
                }}
            >
                I
            </Button>
        </div>
    )
}

export default FileCard;
