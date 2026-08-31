import Button from "./Button";
import { useState } from "react";

interface Props {
  onLogin: () => void;
  mode: "login" | "signup";
}
function LoginPage({ onLogin, mode }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "signup" && password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    // Simulate backend auth success
    if (email && password) {
      console.log(email,password);
      onLogin();
    }
  };
  return (
    <>
      
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
