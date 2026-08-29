import type { ReactNode, CSSProperties } from "react";

interface Props {
  children: ReactNode;
  onClick: () => void;
  style?: CSSProperties;
}
function Button({ children, onClick, style}: Props) {
  return (
    <button className="btn-void" onClick={onClick} style={style}>
      {children}
    </button>
  );
}

export default Button;
