"use client";
import { useEffect, useMemo, useState, useCallback } from "react";

const PRIORITY_CONFIG = {
  Critical: { bg: "bg-red-100 dark:bg-red-900/40",    text: "text-red-700 dark:text-red-300",    dot: "bg-red-500"    },
  High:     { bg: "bg-orange-100 dark:bg-orange-900/40", text: "text-orange-700 dark:text-orange-300", dot: "bg-orange-500" },
  Medium:   { bg: "bg-yellow-100 dark:bg-yellow-900/40", text: "text-yellow-700 dark:text-yellow-300", dot: "bg-yellow-500" },
  Low:      { bg: "bg-green-100 dark:bg-green-900/40",  text: "text-green-700 dark:text-green-300",  dot: "bg-green-500"  },
};

const STATUS_CONFIG = {
  "Todo":        { bg: "bg-gray-100 dark:bg-gray-700",       text: "text-gray-600 dark:text-gray-300",   icon: "⬜" },
  "In Progress": { bg: "bg-blue-100 dark:bg-blue-900/40",    text: "text-blue-700 dark:text-blue-300",   icon: "🔄" },
  "Done":        { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-300", icon: "✅" },
};

const CATEGORY_COLORS = [
  { bg: "bg-indigo-100 dark:bg-indigo-900/50",  text: "text-indigo-700 dark:text-indigo-300",  dot: "bg-indigo-500"  },
  { bg: "bg-pink-100 dark:bg-pink-900/50",       text: "text-pink-700 dark:text-pink-300",       dot: "bg-pink-500"    },
  { bg: "bg-violet-100 dark:bg-violet-900/50",   text: "text-violet-700 dark:text-violet-300",   dot: "bg-violet-500"  },
  { bg: "bg-cyan-100 dark:bg-cyan-900/50",       text: "text-cyan-700 dark:text-cyan-300",       dot: "bg-cyan-500"    },
  { bg: "bg-amber-100 dark:bg-amber-900/50",     text: "text-amber-700 dark:text-amber-300",     dot: "bg-amber-500"   },
  { bg: "bg-teal-100 dark:bg-teal-900/50",       text: "text-teal-700 dark:text-teal-300",       dot: "bg-teal-500"    },
];

const inputCls = "border dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 rounded-lg text-sm text-gray-900 dark:text-white w-full outline-none";

function isOverdue(estimatedDate, status) {
  if (!estimatedDate || status === "Done") return false;
  return new Date(estimatedDate) < new Date(new Date().toDateString());
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");

  const emptyForm = { title: "", description: "", category: "General", priority: "Medium", status: "Todo", estimatedDate: "" };
  const [formData, setFormData] = useState(emptyForm);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  async function fetchTasks() {
    setLoading(true);
    try { const res = await fetch("/api/tasks"); setTasks(await res.json()); }
    catch { showToast("Failed to load tasks", "error"); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchTasks(); /* eslint-disable-next-line */ }, []);

  const uniqueCategories = useMemo(() =>
    [...new Set(tasks.map((t) => t.category).filter(Boolean))].sort(), [tasks]);

  const categoryColorMap = useMemo(() => {
    const map = {};
    uniqueCategories.forEach((c, i) => { map[c] = CATEGORY_COLORS[i % CATEGORY_COLORS.length]; });
    return map;
  }, [uniqueCategories]);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const q = search.toLowerCase();
      const matchSearch = !q || t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q) || t.category?.toLowerCase().includes(q);
      const matchCat = !selectedCategory || t.category === selectedCategory;
      const matchStatus = !selectedStatus || t.status === selectedStatus;
      const matchPriority = !selectedPriority || t.priority === selectedPriority;
      return matchSearch && matchCat && matchStatus && matchPriority;
    });
  }, [tasks, search, selectedCategory, selectedStatus, selectedPriority]);

  // Stats
  const stats = useMemo(() => ({
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "Todo").length,
    inProgress: tasks.filter((t) => t.status === "In Progress").length,
    done: tasks.filter((t) => t.status === "Done").length,
    overdue: tasks.filter((t) => isOverdue(t.estimatedDate, t.status)).length,
  }), [tasks]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.title) { showToast("Title is required", "error"); return; }
    setSubmitting(true);
    const payload = { ...formData, estimatedDate: formData.estimatedDate || null };
    try {
      const res = editingId
        ? await fetch(`/api/tasks/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) { showToast(editingId ? "Task updated!" : "Task added!"); resetForm(); fetchTasks(); }
      else showToast("Save failed", "error");
    } catch { showToast("Network error", "error"); }
    finally { setSubmitting(false); }
  }

  function handleEdit(task) {
    setEditingId(task._id);
    setFormData({
      title: task.title,
      description: task.description || "",
      category: task.category || "General",
      priority: task.priority || "Medium",
      status: task.status || "Todo",
      estimatedDate: task.estimatedDate ? new Date(task.estimatedDate).toISOString().split("T")[0] : "",
    });
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this task?")) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (res.ok) { showToast("Task deleted"); fetchTasks(); }
    } catch { showToast("Delete failed", "error"); }
  }

  async function cycleStatus(task) {
    const cycle = { "Todo": "In Progress", "In Progress": "Done", "Done": "Todo" };
    const newStatus = cycle[task.status] || "Todo";
    try {
      await fetch(`/api/tasks/${task._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...task, status: newStatus }) });
      fetchTasks();
    } catch { showToast("Update failed", "error"); }
  }

  function resetForm() { setEditingId(null); setFormData(emptyForm); setFormOpen(false); }

  const hasActiveFilter = search || selectedCategory || selectedStatus || selectedPriority;

  // Group filtered tasks by status for kanban-style display
  const todoTasks       = filtered.filter((t) => t.status === "Todo");
  const inProgressTasks = filtered.filter((t) => t.status === "In Progress");
  const doneTasks       = filtered.filter((t) => t.status === "Done");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium max-w-sm ${toast.type === "error" ? "bg-red-600" : "bg-green-600"}`}>
          {toast.msg}
        </div>
      )}

      <div className="p-6 max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">✅ Tasks</h1>
            <p className="text-sm text-gray-500 mt-1">{stats.total} tasks · {stats.inProgress} in progress · {stats.done} done{stats.overdue > 0 ? ` · ⚠️ ${stats.overdue} overdue` : ""}</p>
          </div>
          <button
            onClick={() => { setFormOpen((o) => !o); if (formOpen) resetForm(); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {formOpen ? "✕ Close Form" : "+ Add Task"}
          </button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Todo",        value: stats.todo,       color: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300" },
            { label: "In Progress", value: stats.inProgress, color: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" },
            { label: "Done",        value: stats.done,       color: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300" },
            { label: "Overdue",     value: stats.overdue,    color: stats.overdue > 0 ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300" : "bg-gray-100 dark:bg-gray-800 text-gray-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-xl p-4 ${color} flex flex-col`}>
              <span className="text-2xl font-bold">{value}</span>
              <span className="text-xs font-medium mt-0.5">{label}</span>
            </div>
          ))}
        </div>

        {/* Form */}
        {formOpen && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">{editingId ? "✏️ Edit Task" : "➕ Add New Task"}</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Title *</label>
                  <input value={formData.title} onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))} placeholder="Task title" required className={inputCls} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</label>
                  <input list="cat-list" value={formData.category} onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))} placeholder="e.g. General, Work, Personal" className={inputCls} />
                  <datalist id="cat-list">{uniqueCategories.map((c) => <option key={c} value={c} />)}</datalist>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Estimated Date</label>
                  <input type="date" value={formData.estimatedDate} onChange={(e) => setFormData((p) => ({ ...p, estimatedDate: e.target.value }))} className={inputCls} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Priority</label>
                  <select value={formData.priority} onChange={(e) => setFormData((p) => ({ ...p, priority: e.target.value }))} className={inputCls}>
                    {["Low", "Medium", "High", "Critical"].map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))} className={inputCls}>
                    {["Todo", "In Progress", "Done"].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} placeholder="Optional details…" rows={3} className={`${inputCls} resize-y`} />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={submitting} className="flex-1 sm:flex-none sm:w-40 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 px-4 rounded-lg text-sm font-medium">
                  {submitting ? "Saving…" : editingId ? "Update" : "Add Task"}
                </button>
                <button type="button" onClick={resetForm} className="flex-1 sm:flex-none sm:w-32 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white py-2.5 px-4 rounded-lg text-sm font-medium">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input type="text" placeholder="Search tasks…" value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none" />
            </div>
            {/* Status filter */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-400 font-medium">Status:</span>
              <button onClick={() => setSelectedStatus("")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${!selectedStatus ? "bg-gray-700 text-white border-gray-700" : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
                All
              </button>
              {Object.entries(STATUS_CONFIG).map(([s, cfg]) => (
                <button key={s} onClick={() => setSelectedStatus(selectedStatus === s ? "" : s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${selectedStatus === s ? `${cfg.bg} ${cfg.text} border-transparent font-bold` : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
                  {cfg.icon} {s}
                </button>
              ))}
            </div>
            {/* Priority filter */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-400 font-medium">Priority:</span>
              <button onClick={() => setSelectedPriority("")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${!selectedPriority ? "bg-gray-700 text-white border-gray-700" : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
                All
              </button>
              {Object.entries(PRIORITY_CONFIG).map(([p, cfg]) => (
                <button key={p} onClick={() => setSelectedPriority(selectedPriority === p ? "" : p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${selectedPriority === p ? `${cfg.bg} ${cfg.text} border-transparent font-bold` : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{p}
                </button>
              ))}
            </div>
            {/* Category filter */}
            {uniqueCategories.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-400 font-medium">Category:</span>
                <button onClick={() => setSelectedCategory("")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${!selectedCategory ? "bg-gray-700 text-white border-gray-700" : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
                  All
                </button>
                {uniqueCategories.map((c) => {
                  const color = categoryColorMap[c] || CATEGORY_COLORS[0];
                  return (
                    <button key={c} onClick={() => setSelectedCategory(selectedCategory === c ? "" : c)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${selectedCategory === c ? `${color.bg} ${color.text} border-transparent font-bold` : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />{c}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {hasActiveFilter && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t dark:border-gray-800">
              {search && <span className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs px-2 py-1 rounded-full">Search: {search}<button onClick={() => setSearch("")} className="ml-1 hover:text-red-500">✕</button></span>}
              {selectedStatus && <span className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full">Status: {selectedStatus}<button onClick={() => setSelectedStatus("")} className="ml-1 hover:text-red-500">✕</button></span>}
              {selectedPriority && <span className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full">Priority: {selectedPriority}<button onClick={() => setSelectedPriority("")} className="ml-1 hover:text-red-500">✕</button></span>}
              {selectedCategory && <span className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full">Category: {selectedCategory}<button onClick={() => setSelectedCategory("")} className="ml-1 hover:text-red-500">✕</button></span>}
              <button onClick={() => { setSearch(""); setSelectedStatus(""); setSelectedPriority(""); setSelectedCategory(""); }} className="text-xs text-gray-500 hover:text-red-500 underline">Clear all</button>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2">Showing {filtered.length} of {tasks.length} tasks</p>
        </div>

        {/* Task Cards grouped by status */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400"><span className="animate-spin mr-2">⟳</span> Loading tasks…</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-sm">No tasks found.</p>
            <button onClick={() => setFormOpen(true)} className="mt-4 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg">Add First Task</button>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {[
              { label: "In Progress", tasks: inProgressTasks, icon: "🔄", headerCls: "text-blue-600 dark:text-blue-400" },
              { label: "Todo",        tasks: todoTasks,        icon: "⬜", headerCls: "text-gray-600 dark:text-gray-400" },
              { label: "Done",        tasks: doneTasks,        icon: "✅", headerCls: "text-emerald-600 dark:text-emerald-400" },
            ].map(({ label, tasks: groupTasks, icon, headerCls }) =>
              groupTasks.length > 0 ? (
                <div key={label}>
                  <h2 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${headerCls}`}>
                    <span>{icon}</span> {label} <span className="text-gray-400 font-normal">({groupTasks.length})</span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {groupTasks.map((task) => {
                      const pCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.Medium;
                      const sCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.Todo;
                      const catColor = categoryColorMap[task.category] || CATEGORY_COLORS[0];
                      const overdue = isOverdue(task.estimatedDate, task.status);
                      return (
                        <div key={task._id} className={`bg-white dark:bg-gray-900 border-2 rounded-xl p-4 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow ${overdue ? "border-red-400 dark:border-red-600" : "border-gray-200 dark:border-gray-800"}`}>
                          {/* Top row */}
                          <div className="flex items-start justify-between gap-2">
                            <h3 className={`font-semibold text-sm leading-snug flex-1 ${task.status === "Done" ? "line-through text-gray-400" : "text-gray-900 dark:text-white"}`}>{task.title}</h3>
                            <button onClick={() => cycleStatus(task)} title="Click to cycle status" className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 cursor-pointer ${sCfg.bg} ${sCfg.text}`}>
                              {sCfg.icon}
                            </button>
                          </div>
                          {/* Badges */}
                          <div className="flex flex-wrap gap-1.5">
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded ${catColor.bg} ${catColor.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${catColor.dot}`} />{task.category}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded ${pCfg.bg} ${pCfg.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${pCfg.dot}`} />{task.priority}
                            </span>
                          </div>
                          {/* Description */}
                          {task.description && (
                            <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed line-clamp-3 whitespace-pre-wrap flex-1">{task.description}</p>
                          )}
                          {/* Footer */}
                          <div className="flex items-center justify-between gap-2 pt-1 border-t dark:border-gray-800">
                            <div className="flex flex-col gap-0.5">
                              {task.estimatedDate && (
                                <span className={`text-xs font-medium ${overdue ? "text-red-500" : "text-gray-400"}`}>
                                  {overdue ? "⚠️ " : "📅 "}{formatDate(task.estimatedDate)}
                                </span>
                              )}
                              <span className="text-xs text-gray-400">{new Date(task.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex gap-1.5">
                              <button onClick={() => handleEdit(task)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2.5 py-1 rounded transition-colors">Edit</button>
                              <button onClick={() => handleDelete(task._id)} className="bg-red-500 hover:bg-red-600 text-white text-xs px-2.5 py-1 rounded transition-colors">Delete</button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null
            )}
          </div>
        )}
      </div>
    </div>
  );
}