"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function ActivityPage() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    api.get("/api/activity").then((res) => {
      setLogs(res.data);
    });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Activity Log</h1>

      {logs.map((log) => (
        <div
          key={log.id}
          className="p-4 mb-3 bg-white dark:bg-gray-800 rounded shadow"
        >
          <p className="font-semibold">
            {log.user?.name} ({log.user?.role})
          </p>

          <p>{log.action}</p>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(log.createdAt).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
