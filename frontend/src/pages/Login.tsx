import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import "./Login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { loginUser } = useAuth();
  const navigate = useNavigate();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await login(username, password);
      loginUser(response.token);
      navigate("/");
    } catch {
      setError("Invalid username or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div>
            <div className="login-brand-name">CloudOps Insight</div>
            <div className="login-brand-sub">Cloud Operations Dashboard</div>
          </div>
        </div>

        <div className="login-heading">
          <h1>Welcome back</h1>
          <p>Sign in to your dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="login-field">
            <label className="login-label">Username</label>
            <input
              className="login-input"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="login-field">
            <label className="login-label">Password</label>
            <input
              type="password"
              className="login-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <><span className="login-spinner" />Signing in…</>
            ) : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
