import Button from "./Button";

function Input() {
  return (
    <div
      className="input-void"
      style={{
        display: "flex",
        alignItems: "center",
        padding: "0.75rem 0.75rem 0.75rem 1.5rem", 
        maxWidth: "800px",
        margin: "3rem auto",
      }}
    >
      <input
        type="text"
        placeholder="Search"
        style={{
          border: "none",
          outline: "none",
          background: "transparent",
          fontFamily: "inherit",
          fontSize: "1.2rem",
          color: "inherit",
          flexGrow: 1,
          width: "100%",
        }}
      />
      
      <Button
        onClick={() => console.log("test")}
        style={{
          padding: "0.4rem 1.2rem",
          fontSize: "0.9rem",
          flexShrink: 0,
        }}
      >
        Mode
      </Button>
    </div>
  );
}

export default Input;

