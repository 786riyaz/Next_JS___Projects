import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { formatRelative } from "@/utils/dateFormat";

const JWT_SECRET = process.env.JWT_SECRET!;

export default async function DashboardPage() {
  const cookieStore = await cookies(); // ✅ FIXED
  const token = cookieStore.get("token")?.value;

  if (!token) {
    throw new Error("Unauthorized");
  }

  let user: any;

  try {
    user = jwt.verify(token, JWT_SECRET);
  } catch {
    throw new Error("Invalid token");
  }

  const whereClause =
    user.role === "USER"
      ? { assignedToId: user.id }
      : {};

  const tasks = await prisma.task.findMany({
    where: whereClause,
    include: {
      assignedTo: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === "PENDING").length,
    inProgress: tasks.filter(t => t.status === "IN_PROGRESS").length,
    completed: tasks.filter(t => t.status === "COMPLETED").length,
  };

  const recentTasks = tasks.slice(0, 5);

  return (
    <div className="min-h-screen px-6 py-8 bg-gray-100 dark:bg-gray-900 transition-colors">
      <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">
        Dashboard Overview
      </h1>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Tasks" value={stats.total} />
        <StatCard label="Pending" value={stats.pending} />
        <StatCard label="In Progress" value={stats.inProgress} />
        <StatCard label="Completed" value={stats.completed} />
      </div>

      <h2 className="mt-12 mb-6 text-xl font-semibold text-gray-800 dark:text-white">
        Recent Tasks
      </h2>

      <div className="space-y-4">
        {recentTasks.map((task) => (
          <div
            key={task.id}
            className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow"
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

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
      <h2 className="text-sm text-gray-500 dark:text-gray-400">
        {label}
      </h2>
      <p className="text-3xl font-bold mt-3 text-gray-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}