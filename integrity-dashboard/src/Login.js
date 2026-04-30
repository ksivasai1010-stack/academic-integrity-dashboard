import React, { useState } from "react";
import { motion } from "framer-motion";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const users = [
    { username: "admin_user", password: "Xebia@2026", role: "admin" },
    { username: "student1", password: "demo123", role: "student" }
  ];

  const handleLogin = () => {
    setError("");

    if (!username || !password) {
      setError("Please fill all fields");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const validUser = users.find(
        (u) =>
          u.username === username &&
          u.password === password &&
          u.role === role
      );

      if (validUser) {
        // Removed localStorage persistence as per request
        onLogin(validUser);
      } else {
        setError("Invalid credentials or role");
      }

      setLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#020617] via-[#0f172a] to-black text-white overflow-hidden relative">

      {/* Background Glow */}
      <div className="absolute w-[500px] h-[500px] bg-purple-600/20 blur-[140px] top-0 left-0"></div>
      <div className="absolute w-[500px] h-[500px] bg-blue-600/20 blur-[140px] bottom-0 right-0"></div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 w-[360px] shadow-2xl"
      >
        <h2 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          Xebia Login
        </h2>

        {/* ROLE SELECT */}
        <div className="flex mb-4 bg-black/30 rounded-lg overflow-hidden">
          <button
            className={`flex-1 py-2 text-sm ${
              role === "admin"
                ? "bg-purple-600"
                : "hover:bg-white/10"
            }`}
            onClick={() => setRole("admin")}
          >
            Admin
          </button>
          <button
            className={`flex-1 py-2 text-sm ${
              role === "student"
                ? "bg-blue-600"
                : "hover:bg-white/10"
            }`}
            onClick={() => setRole("student")}
          >
            Student
          </button>
        </div>

        {/* USERNAME */}
        <input
          type="text"
          placeholder="Username"
          className="w-full p-3 mb-4 bg-black/40 border border-white/10 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        {/* PASSWORD */}
        <div className="relative mb-4">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="w-full p-3 bg-black/40 border border-white/10 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <span
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-xs cursor-pointer text-gray-400"
          >
            {showPassword ? "Hide" : "Show"}
          </span>
        </div>

        {/* ERROR */}
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-sm mb-3 text-center"
          >
            {error}
          </motion.p>
        )}

        {/* BUTTON */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:scale-105 transition-all font-semibold shadow-lg"
        >
          {loading ? "Authenticating..." : "Login"}
        </button>

        {/* DEMO */}
        <p className="text-xs text-gray-400 text-center mt-4">
          admin_user / Xebia@2026
        </p>
      </motion.div>
    </div>
  );
}
