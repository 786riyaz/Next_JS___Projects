"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const linkClass = (path: string) =>
    `block pb-1 transition ${
      pathname === path
        ? "underline underline-offset-4 font-semibold text-blue-600 dark:text-blue-400"
        : "hover:text-blue-500"
    }`;

  return (
    <div className="w-64 bg-white dark:bg-gray-800 shadow-md p-6 min-h-screen">
      <h2 className="text-xl font-bold mb-8 text-gray-800 dark:text-white">
        Task Manager
      </h2>

      <nav className="space-y-4 text-gray-700 dark:text-gray-300">
        <Link href="/dashboard" className={linkClass("/dashboard")}>
          Dashboard
        </Link>

        <Link href="/tasks" className={linkClass("/tasks")}>
          Tasks
        </Link>

        <Link href="/profile" className={linkClass("/profile")}>
          Profile
        </Link>

        {user?.role === "ADMIN" && (
          <Link
            href="/admin/users"
            className={linkClass("/admin/users")}
          >
            Manage Users
          </Link>
        )}
      </nav>
    </div>
  );
}