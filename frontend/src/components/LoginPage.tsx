import Button from "./Button";
import { useState } from "react";
import { getUser, signUpUser } from "../services/api";
import Toast from "./Toast";

interface Props {
  onLogin: () => void;
  mode: "login" | "signup";
}

function LoginPage({ onLogin, mode }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [toastKey, setToastKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showErr = (message: string) => {
    setErrorMessage(message);
    setShowError(true);
    setToastKey((prev) => prev + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (password.length < 6) {
      showErr("Password must be at least 6 characters");
      return;
    }
    setIsSubmitting(true);
    try {
      if (mode === "signup") {
        if (password !== confirmPassword) {
          showErr("Passwords do not match");
          return;
        }
        try {
          await signUpUser(email, password);
        } catch (err: any) {
          const backendError = err.response?.data?.detail;
          showErr(
            typeof backendError === "string"
              ? backendError
              : "Signup failed"
          );
          return;
        }
      }

      try {
        const data = await getUser(email, password);
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("email", data.email || email);
        onLogin();
      } catch (err: any) {
        const backendError = err.response?.data?.detail;
        showErr(
          typeof backendError === "string"
            ? backendError
            : mode === "signup"
              ? "Signup succeeded but login failed — check email confirmation, then log in"
              : "Wrong Email or Password"
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {showError && (
        <Toast key={toastKey} onClose={() => setShowError(false)}>
          {errorMessage}
        </Toast>
      )}
      <div className="auth-container">
        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="email"
            placeholder="Email"
            className="input-void auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password (min 6 characters)"
            className="input-void auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          {mode === "signup" && (
            <input
              type="password"
              placeholder="Confirm Password"
              className="input-void auth-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          )}
          <Button type="submit" className="btn-upload" disabled={isSubmitting}>
            {isSubmitting
              ? "Please wait..."
              : mode === "login"
                ? "Login"
                : "Sign up"}
          </Button>
        </form>
      </div>
    </>
  );
}

export default LoginPage;
