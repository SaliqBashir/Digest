import { useState } from "react";
import Button from "./Button";

interface Props {
  placeholder?: string;
  onSearch?: (query: string, mode: "id" | "lookup") => void;
}

function Input({ placeholder, onSearch }: Props) {
  const [mode, setMode] = useState<"id" | "lookup">("id");
  const [query, setQuery] = useState("");

  const toggleMode = () => {
    setMode(prev => (prev === "id" ? "lookup" : "id"));
  };

  return (
    <div className="input-void search-bar-container">
      <input
        type="text"
        placeholder={placeholder || (mode === "id" ? "Search by ID..." : "Lookup by text...")}
        className="search-bar-input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onSearch) {
            onSearch(query, mode);
          }
        }}
      />
      
      <Button
        onClick={toggleMode}
        className="btn-search"
      >
        {mode.toUpperCase()}
      </Button>
    </div>
  );
}

export default Input;

