import type { ReactNode, CSSProperties, MouseEvent, ButtonHTMLAttributes } from "react";

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
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
  ...rest
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`btn-void ${className || ""}`.trim()}
      onClick={onClick}
      style={style}
      {...rest}
    >
      {children}
    </button>
  );
}

export default Button;
