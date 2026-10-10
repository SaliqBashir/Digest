import { useState } from "react";
import Button from "./Button";

export type SortBy = "newest" | "oldest" | "name-asc" | "name-desc" | "type" | "size-desc" | "size-asc";

const OPTIONS: { value: SortBy; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "name-asc", label: "Name A-Z" },
  { value: "name-desc", label: "Name Z-A" },
  { value: "type", label: "Type" },
  { value: "size-desc", label: "Largest" },
  { value: "size-asc", label: "Smallest" },
];

interface Props {
  sortBy: SortBy;
  onChange: (sort: SortBy) => void;
}

function SortControl({ sortBy, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const current = OPTIONS.find((o) => o.value === sortBy) ?? OPTIONS[0];

  return (
    <div className="sort-wrapper">
      <Button onClick={() => setOpen((prev) => !prev)}>
        Sort: {current.label}
      </Button>
      {open && (
        <>
          <div className="sort-overlay" onClick={() => setOpen(false)} />
          <div className="sort-menu">
            {OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`sort-option${opt.value === sortBy ? " active" : ""}`}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default SortControl;
