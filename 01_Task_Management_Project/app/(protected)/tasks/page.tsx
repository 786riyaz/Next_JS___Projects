"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { formatRelative } from "@/utils/dateFormat";
import { useAuth } from "@/context/AuthContext";

export default function TasksPage() {
  const { user } = useAuth();

  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    assignedToId: "",
  });

  const statusColors: Record<string, string> = {
    PENDING:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    IN_PROGRESS:
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    COMPLETED:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  };

  /* ---------------- FETCH ---------------- */

  const fetchTasks = async () => {
    try {
      const res = await api.get("/api/tasks");
      setTasks(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get("/api/users");
      setUsers(res.data?.users || []);
    } catch {
      setUsers([]);
    }
  };

  useEffect(() => {
    if (!user) return;

    fetchTasks();

    if (user.role !== "USER") {
      fetchUsers();
    }
  }, [user]);

  /* ---------------- CREATE ---------------- */

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title || !form.assignedToId) {
      toast.error("Title and assigned user required");
      return;
    }

    try {
      setSubmitting(true);

      const res = await api.post("/api/tasks", form);

      // Optimistic update
      setTasks((prev) => [res.data, ...prev]);

      setForm({
        title: "",
        description: "",
        priority: "MEDIUM",
        assignedToId: "",
      });

      toast.success("Task Created");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Create failed");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------- STATUS UPDATE ---------------- */

  const handleStatusChange = async (
    id: string,
    status: string
  ) => {
    try {
      await api.patch(`/api/tasks/${id}`, { status });

      // Optimistic update
      setTasks((prev) =>
        prev.map((task) =>
          task.id === id ? { ...task, status } : task
        )
      );

      toast.success("Status Updated");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Update failed");
    }
  };

  /* ---------------- DELETE ---------------- */

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/tasks/${id}`);

      setTasks((prev) =>
        prev.filter((task) => task.id !== id)
      );

      toast.success("Task deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 text-white">
      <h1 className="text-2xl font-bold mb-6">Tasks</h1>

      {/* ---------------- CREATE FORM ---------------- */}
      {(user?.role === "ADMIN" ||
        user?.role === "MANAGER") && (
        <form
          onSubmit={handleCreate}
          className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow"
        >
          <h2 className="font-semibold mb-4 text-lg">
            Create Task
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              className="p-2 rounded border dark:bg-gray-700 dark:text-white"
              placeholder="Title"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
            />

            <select
              className="p-2 rounded border dark:bg-gray-700 dark:text-white"
              value={form.priority}
              onChange={(e) =>
                setForm({
                  ...form,
                  priority: e.target.value,
                })
              }
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          <textarea
            className="w-full mt-4 p-2 rounded border dark:bg-gray-700 dark:text-white"
            placeholder="Description"
            value={form.description}
            onChange={(e) =>
              setForm({
                ...form,
                description: e.target.value,
              })
            }
          />

          <select
            className="w-full mt-4 p-2 rounded border dark:bg-gray-700 dark:text-white"
            value={form.assignedToId}
            onChange={(e) =>
              setForm({
                ...form,
                assignedToId: e.target.value,
              })
            }
          >
            <option value="">Select User</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>

          <button
            disabled={submitting}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Task"}
          </button>
        </form>
      )}

      {/* ---------------- TASK LIST ---------------- */}

      <div className="space-y-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="p-5 bg-white dark:bg-gray-800 rounded-lg shadow"
          >
            <div className="flex flex-col md:flex-row md:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">
                  {task.title}
                </h2>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Assigned To: {task.assignedTo?.name}
                </p>

                <p className="text-sm text-gray-400">
                  {formatRelative(task.createdAt)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                <span
                  className={`px-3 py-1 text-xs rounded-full font-semibold ${statusColors[task.status]}`}
                >
                  {task.status.replace("_", " ")}
                </span>

                {(user?.role === "USER" ||
                  user?.role === "ADMIN") && (
                  <select
                    value={task.status}
                    onChange={(e) =>
                      handleStatusChange(
                        task.id,
                        e.target.value
                      )
                    }
                    className="px-2 py-1 rounded border dark:bg-gray-700 dark:text-white"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">
                      In Progress
                    </option>
                    <option value="COMPLETED">
                      Completed
                    </option>
                  </select>
                )}

                {(user?.role === "ADMIN" ||
                  user?.role === "MANAGER") && (
                  <button
                    onClick={() =>
                      handleDelete(task.id)
                    }
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}