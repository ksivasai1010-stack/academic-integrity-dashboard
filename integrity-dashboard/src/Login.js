import React, { useState } from "react";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (username === "admin" && password === "1234") {
      localStorage.setItem("user", username);
      onLogin();
    } else {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0b0f1a] to-black text-white">
      <div className="bg-white/5 backdrop-blur-xl p-8 rounded-xl border border-white/10 w-80">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

        <input
          type="text"
          placeholder="Username"
          className="w-full p-2 mb-3 bg-black/40 rounded outline-none border border-white/5 focus:border-purple-500/50 transition-all"
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 mb-4 bg-black/40 rounded outline-none border border-white/5 focus:border-purple-500/50 transition-all"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 p-2 rounded font-bold hover:opacity-90 transition-opacity"
        >
          Login
        </button>
      </div>
    </div>
  );
}
