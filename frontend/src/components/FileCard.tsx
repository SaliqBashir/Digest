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
                className="btn-icon-large"
            >
                I
            </Button>
        </div>
    )
}

export default FileCard;
