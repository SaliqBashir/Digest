import Button from "./Button";
import { useState } from "react";
import { getUser, signUpUser } from "../services/api";
import Toast from "./Toast"

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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === "signup") {
        if (password !== confirmPassword) {
          setErrorMessage("Passwords do not match");
          setShowError(true);
          setToastKey(prev => prev + 1);
          return;
        }
        await signUpUser(email, password);
      }
      
      const data = await getUser(email, password);
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("email", data.email || email); // Fallback to state email if backend hasn't updated yet
      onLogin();
    } catch(err: any) {
      const backendError = err.response?.data?.detail;
      const defaultMessage = mode === "signup" ? "Signup failed" : "Wrong Email or Password";
      setErrorMessage(backendError || defaultMessage);
      setShowError(true);
      setToastKey(prev => prev + 1);
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
            placeholder="Password"
            className="input-void auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {mode === "signup" && (
            <input
              type="password"
              placeholder="Confirm Password"
              className="input-void auth-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              aria-required
            />
          )}
          <Button onClick={() => {}} className="btn-upload">
            {mode === "login" ? "Login" : "Sign up"}
          </Button>
        </form>
      </div>
    </>
  );
}

export default LoginPage;
