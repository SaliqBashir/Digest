import type { ReactNode, CSSProperties } from "react";

interface Props {
  children: ReactNode;
  onClick: () => void;
  style?: CSSProperties;
  className?: string;
}
function Button({ children, onClick, style, className }: Props) {
  return (
    <button className={`btn-void ${className || ""}`.trim()} onClick={onClick} style={style}>
      {children}
    </button>
  );
}

export default Button;
