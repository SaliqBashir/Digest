import type { ReactNode, CSSProperties, MouseEvent } from "react";

interface Props {
  children: ReactNode;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  style?: CSSProperties;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

function Button({
  children,
  onClick,
  style,
  className,
  type = "button",
  disabled = false,
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`btn-void ${className || ""}`.trim()}
      onClick={onClick}
      style={style}
    >
      {children}
    </button>
  );
}

export default Button;
