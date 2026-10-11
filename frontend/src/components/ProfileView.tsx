import { useState } from "react";
import Button from "./Button";
import Toast from "./Toast";
import { updatePassword } from "../services/api";

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const segment = token.split(".")[1];
    if (!segment) return null;
    // base64url -> base64 for atob
    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export default function ProfileView() {
  const getEmail = () => {
    const saved = localStorage.getItem("email");
    if (saved) return saved;
    const token = localStorage.getItem("token");
    if (token) {
      const payload = decodeJwtPayload(token);
      if (payload?.email) return payload.email as string;
    }
    return "Unknown Email";
  };

  const email = getEmail();
  const [password, setPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastKey, setToastKey] = useState(0);

  const showMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setToastKey((prev) => prev + 1);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      showMessage("Password cannot be empty");
      return;
    }
    if (password.length < 6) {
      showMessage("Password must be at least 6 characters");
      return;
    }

    setIsSaving(true);
    try {
      await updatePassword(password);
      showMessage("Password updated successfully");
      setPassword("");
    } catch (err: any) {
      const backendError = err.response?.data?.detail;
      showMessage(
        typeof backendError === "string"
          ? backendError
          : "Failed to update password"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {showToast && (
        <Toast key={toastKey} onClose={() => setShowToast(false)}>
          {toastMessage}
        </Toast>
      )}
      <div className="auth-container">
        <div style={{ marginBottom: "3rem", marginTop: "-2rem" }}>
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="4" className="profile-avatar">
            <circle cx="60" cy="40" r="24" />
            <path d="M 24 100 C 24 64, 96 64, 96 100" />
          </svg>
        </div>

        <form onSubmit={handleSave} className="auth-form" style={{ gap: "2rem" }}>
          <input
            type="email"
            className="input-void auth-input"
            value={email}
            readOnly
            style={{ color: "var(--text-muted)", cursor: "not-allowed" }}
          />

          <input
            type="password"
            placeholder="New Password (min 6 characters)"
            className="input-void auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
          />

          <Button type="submit" className="btn-upload" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </form>
      </div>
    </>
  );
}
