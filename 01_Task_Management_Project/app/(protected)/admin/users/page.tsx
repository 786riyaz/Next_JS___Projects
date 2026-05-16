"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function UsersPage() {
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.get(`/api/users?page=${page}`).then((res) => {
      setData(res.data);
    });
  }, [page]);

  if (!data) return <div>Loading...</div>;

  return (
    <div className="p-6 text-white">
      <h1 className="text-xl font-bold mb-4">
        Manage Users
      </h1>

      {data.users.map((u: any) => (
        <div
          key={u.id}
          className="p-4 mb-2 bg-gray-100 shadow rounded dark:bg-gray-700"
        >
          {u.name} — {u.role}
        </div>
      ))}

      <div className="flex gap-2 mt-4 ">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="px-3 py-1 bg-gray-200 rounded dark:bg-gray-700"
        >
          Prev
        </button>

        <button
          disabled={page === data.pages}
          onClick={() => setPage(page + 1)}
          className="px-3 py-1 bg-gray-200 rounded dark:bg-gray-700"
        >
          Next
        </button>
      </div>
    </div>
  );
}