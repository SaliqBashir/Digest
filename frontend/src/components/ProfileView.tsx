import { useState } from "react";
import Button from "./Button";
import Toast from "./Toast";
import { updatePassword } from "../services/api";

export default function ProfileView() {
  const getEmail = () => {
    const saved = localStorage.getItem("email");
    if (saved) return saved;
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.email) return payload.email;
      } catch (e) {}
    }
    return "Unknown Email";
  };

  const email = getEmail();
  const [password, setPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastKey, setToastKey] = useState(0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setToastMessage("Password cannot be empty");
      setShowToast(true);
      setToastKey(prev => prev + 1);
      return;
    }
    
    setIsSaving(true);
    try {
      await updatePassword(password);
      setToastMessage("Password updated successfully");
      setShowToast(true);
      setToastKey(prev => prev + 1);
      setPassword(""); // Clear the field after success
    } catch (err: any) {
      const backendError = err.response?.data?.detail;
      setToastMessage(backendError || "Failed to update password");
      setShowToast(true);
      setToastKey(prev => prev + 1);
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
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" stroke="black" strokeWidth="4">
            <circle cx="60" cy="40" r="24" />
            <path d="M 24 100 C 24 64, 96 64, 96 100" />
          </svg>
        </div>
        
        <form onSubmit={handleSave} className="auth-form" style={{ gap: '2rem' }}>
          <input
            type="email"
            className="input-void auth-input"
            value={email}
            readOnly
            style={{ color: "#888", cursor: "not-allowed" }}
          />

          <input
            type="password"
            placeholder="New Password"
            className="input-void auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button onClick={() => {}} className="btn-upload">
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </form>
      </div>
    </>
  );
}
