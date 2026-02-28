"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { formatRelative } from "@/utils/dateFormat";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get("/api/dashboard").then((res) => {
      setData(res.data);
    });
  }, []);

  if (!data)
    return (
      <div className="p-6 text-center">
        Loading dashboard...
      </div>
    );

  const { stats, recentTasks } = data;
  console.log("Dashboard Data:", data);

  const cards = [
    { label: "Total Tasks", value: stats.total },
    { label: "Pending", value: stats.pending },
    { label: "In Progress", value: stats.inProgress },
    { label: "Completed", value: stats.completed },
  ];

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8 bg-gray-100 dark:bg-gray-900 transition-colors">
      
      {/* Header */}
      <h1 className="text-2xl sm:text-3xl font-bold mb-8 text-gray-800 dark:text-white">
        Dashboard Overview
      </h1>

      {/* Stats Grid */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition"
          >
            <h2 className="text-sm text-gray-500 dark:text-gray-400">
              {card.label}
            </h2>
            <p className="text-3xl font-bold mt-3 text-gray-900 dark:text-white">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Tasks */}
      <h2 className="mt-12 mb-6 text-xl font-semibold text-gray-800 dark:text-white">
        Recent Tasks
      </h2>

      <div className="space-y-4">
        {recentTasks.length === 0 && (
          <div className="text-gray-500 dark:text-gray-400">
            No recent tasks found.
          </div>
        )}

        {recentTasks.map((task: any) => (
          <div
            key={task.id}
            className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {task.title}
            </h3>

            <p className="text-sm mt-1 text-gray-500 dark:text-gray-400">
              Assigned To: {task.assignedTo?.name}
            </p>

            <p className="text-sm text-gray-400">
              {formatRelative(task.createdAt)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}