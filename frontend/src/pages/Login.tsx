import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { loginUser } = useAuth();
  const navigate = useNavigate();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    try {
      const response = await login(username, password);
      loginUser(response.token);
      navigate("/");
    } catch {
      setError("Invalid username or password");
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f8fafc" }}>
      <form
        onSubmit={handleLogin}
        style={{
          background: "white",
          padding: "24px",
          borderRadius: "16px",
          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
          width: "320px",
        }}
      >
        <h2>Login</h2>

        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ width: "100%", marginBottom: "12px", padding: "10px" }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", marginBottom: "12px", padding: "10px" }}
        />

        <button type="submit" style={{ width: "100%", padding: "10px" }}>
          Sign In
        </button>

        {error && <p style={{ color: "red", marginTop: "12px" }}>{error}</p>}
      </form>
    </div>
  );
}