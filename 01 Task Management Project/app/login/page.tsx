"use client";

import { useState, useContext } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { ThemeContext } from "@/context/ThemeContext";
import Link from "next/link";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const { theme, toggleTheme } =
    useContext(ThemeContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center text-white bg-gray-100 dark:bg-gray-900 relative">
      
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-5 right-5 px-3 py-1 rounded 
                   bg-gray-200 text-black
                   dark:bg-gray-700 dark:text-white"
      >
        {theme === "dark" ? "Light Mode" : "Dark Mode"}
      </button>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-96"
      >
        <h2 className="text-2xl mb-6 text-center font-bold">
          Login
        </h2>

        <input
          className="w-full mb-4 p-2 border rounded dark:bg-gray-700 dark:text-white"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="w-full mb-4 p-2 border rounded dark:bg-gray-700 dark:text-white"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="w-full bg-blue-600 text-white p-2 rounded">
          Login
        </button>
        <p className="text-sm text-center mt-4">
  Don’t have an account?{" "}
  <Link
    href="/register"
    className="text-blue-600 hover:underline"
  >
    Register
  </Link>
</p>
      </form>
    </div>
  );
}