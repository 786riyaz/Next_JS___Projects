"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useContext } from "react";
import { ThemeContext } from "@/context/ThemeContext";

export default function Header() {
  const { logout, user } = useAuth();
  const router = useRouter();
  const { theme, toggleTheme } =  useContext(ThemeContext);
  console.log("Current theme:", theme);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="bg-white text-white dark:bg-gray-800 shadow px-6 py-4 flex justify-between items-center">
      <div>
        {user && (
          <span className="font-semibold">
            {user.name} ({user.role})
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button
  onClick={toggleTheme}
  className="px-3 py-1 rounded 
             bg-gray-200 text-black
             dark:bg-gray-700 dark:text-white"
>
  {theme === "light"
    ? "Dark Mode"
    : "Light Mode"}
</button>

        <button
          onClick={handleLogout}
          className="px-4 py-1 bg-red-600 text-white rounded"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
