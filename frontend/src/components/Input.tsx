import Button from "./Button";
interface Props{
  placeholder: string;
}
function Input({ placeholder}: Props) {
  return (
    <div className="input-void search-bar-container">
      <input
        type="text"
        placeholder={placeholder}
        className="search-bar-input"
      />
      
      <Button
        onClick={() => console.log("test")}
        className="btn-search"
      >
        Mode
      </Button>
    </div>
  );
}

export default Input;

