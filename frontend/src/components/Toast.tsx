import type { ReactNode } from "react";

interface ToastProps {
  children: ReactNode;
  onClose: () => void;
}

export default function Toast({ children, onClose }: ToastProps) {
  return (
    <div className="toast-container">
      <div className="toast-box">
        <div className="toast-content">{children}</div>
        <button className="btn-void toast-close-btn" onClick={onClose}>
          X
        </button>
      </div>
    </div>
  );
}
