import React, { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import "./fire.css";
import { auth } from "./firebase"; 



function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      if (onLogin) onLogin(); // optional callback
    } catch (err) {
      setError("Invalid email or password");
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      if (onLogin) onLogin(); // optional callback
    } catch (err) {
      setError(err.message || "Signup failed");
    }
  };

  return (
  <div className="login-page">
  <div className="login-container">
    <h2>Login</h2>
    <form onSubmit={handleSignIn}>
      <label htmlFor="email">Username (Email):</label>
      <input
        type="email"
        id="email"
        name="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <label htmlFor="password">Password:</label>
      <input
        type="password"
        id="password"
        name="password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button type="submit">Sign In</button>

      <h5>or sign up for a new account</h5>

      <button type="button" onClick={handleSignUp}>
        Sign Up
      </button>

      {error && <p id="message">{error}</p>}
    </form>
  </div>
</div>

);

}

export default Login;
