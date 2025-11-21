import React, { useState } from "react";
import "./AuthForm.css"; // Create this CSS file
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Notification from "./Notification";

const AuthForm = ({ type }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotification(null);

    try {
      if (type === "register") {
        await register(username, email, password);
        setNotification({ message: "Registration successful!", type: "success" });
        navigate("/dashboard");
      } else {
        await login(email, password);
        setNotification({ message: "Login successful!", type: "success" });
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Auth error:", error.response?.data?.message || error.message);
      setNotification({
        message: error.response?.data?.message || "An error occurred. Please try again.",
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      <h2>{type === "register" ? "Register" : "Login"}</h2>
      <form onSubmit={handleSubmit}>
        {type === "register" && (
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
        )}
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Processing..." : type === "register" ? "Register" : "Login"}
        </button>
      </form>
      {type === "register" ? (
        <p>
          Already have an account? <span onClick={() => navigate("/login")} className="auth-link">Login</span>
        </p>
      ) : (
        <p>
          Don't have an account? <span onClick={() => navigate("/register")} className="auth-link">Register</span>
        </p>
      )}
    </div>
  );
};

export default AuthForm;