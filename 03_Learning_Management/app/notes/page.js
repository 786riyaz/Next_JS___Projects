// app/notes/page.js
"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
const CATEGORY_COLORS = [
  { bg: "bg-indigo-100 dark:bg-indigo-900/50",  text: "text-indigo-700 dark:text-indigo-300",  dot: "bg-indigo-500",  card: "border-indigo-300 dark:border-indigo-700"  },
  { bg: "bg-emerald-100 dark:bg-emerald-900/50", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500", card: "border-emerald-300 dark:border-emerald-700" },
  { bg: "bg-orange-100 dark:bg-orange-900/50",   text: "text-orange-700 dark:text-orange-300",   dot: "bg-orange-500",  card: "border-orange-300 dark:border-orange-700"  },
  { bg: "bg-pink-100 dark:bg-pink-900/50",       text: "text-pink-700 dark:text-pink-300",       dot: "bg-pink-500",    card: "border-pink-300 dark:border-pink-700"      },
  { bg: "bg-violet-100 dark:bg-violet-900/50",   text: "text-violet-700 dark:text-violet-300",   dot: "bg-violet-500",  card: "border-violet-300 dark:border-violet-700"  },
  { bg: "bg-cyan-100 dark:bg-cyan-900/50",       text: "text-cyan-700 dark:text-cyan-300",       dot: "bg-cyan-500",    card: "border-cyan-300 dark:border-cyan-700"      },
  { bg: "bg-amber-100 dark:bg-amber-900/50",     text: "text-amber-700 dark:text-amber-300",     dot: "bg-amber-500",   card: "border-amber-300 dark:border-amber-700"    },
  { bg: "bg-teal-100 dark:bg-teal-900/50",       text: "text-teal-700 dark:text-teal-300",       dot: "bg-teal-500",    card: "border-teal-300 dark:border-teal-700"      },
];
const inputCls = "border dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 rounded-lg text-sm text-gray-900 dark:text-white w-full outline-none";
export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const emptyForm = { title: "", content: "", category: "General", pinned: false };
  const [formData, setFormData] = useState(emptyForm);
  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);
  async function fetchNotes() {
    setLoading(true);
    try { const res = await fetch("/api/notes"); setNotes(await res.json()); }
    catch { showToast("Failed to load notes", "error"); }
    finally { setLoading(false); }
  }
  useEffect(() => { fetchNotes(); /* eslint-disable-next-line */ }, []);
  const uniqueCategories = useMemo(() => [...new Set(notes.map((n) => n.category).filter(Boolean))].sort(), [notes]);
  const categoryColorMap = useMemo(() => {
    const map = {};
    uniqueCategories.forEach((c, i) => { map[c] = CATEGORY_COLORS[i % CATEGORY_COLORS.length]; });
    return map;
  }, [uniqueCategories]);
  const filtered = useMemo(() => {
    return notes.filter((n) => {
      const q = search.toLowerCase();
      const matchSearch = !q || n.title?.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q) || n.category?.toLowerCase().includes(q);
      const matchCat = !selectedCategory || n.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [notes, search, selectedCategory]);
  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.title) { showToast("Title is required", "error"); return; }
    setSubmitting(true);
    try {
      const res = editingId
        ? await fetch(`/api/notes/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) })
        : await fetch("/api/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      if (res.ok) { showToast(editingId ? "Note updated!" : "Note added!"); resetForm(); fetchNotes(); }
      else showToast("Save failed", "error");
    } catch { showToast("Network error", "error"); }
    finally { setSubmitting(false); }
  }
  function handleEdit(note) {
    setEditingId(note._id);
    setFormData({ title: note.title, content: note.content || "", category: note.category || "General", pinned: note.pinned || false });
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function handleDelete(id) {
    if (!window.confirm("Delete this note?")) return;
    try { const res = await fetch(`/api/notes/${id}`, { method: "DELETE" }); if (res.ok) { showToast("Note deleted"); fetchNotes(); } }
    catch { showToast("Delete failed", "error"); }
  }
  async function togglePin(note) {
    try {
      await fetch(`/api/notes/${note._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...note, pinned: !note.pinned }) });
      fetchNotes();
    } catch { showToast("Update failed", "error"); }
  }
  function resetForm() { setEditingId(null); setFormData(emptyForm); setFormOpen(false); }
  // ── Excel Import ────────────────────────────────────────────────────────
  async function handleExcelImport(event) {
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const workbook = XLSX.read(e.target.result, { type: "binary" });
      const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
      const formatted = json.map((item) => ({
        title:    String(item.Title    || "").trim(),
        content:  String(item.Content  || "").trim(),
        category: String(item.Category || "General").trim() || "General",
        pinned:   String(item.Pinned   || "").trim().toLowerCase() === "yes" || String(item.Pinned || "").trim().toLowerCase() === "true",
      })).filter((item) => item.title);
      const existingTitles = new Set(notes.map((n) => n.title.trim().toLowerCase()));
      const skipped = [], toInsert = [];
      for (const item of formatted) {
        const key = item.title.toLowerCase();
        if (existingTitles.has(key)) skipped.push(item.title + " (duplicate title)");
        else { toInsert.push(item); existingTitles.add(key); }
      }
      if (!toInsert.length) { showToast(`⚠️ All ${formatted.length} rows skipped — duplicates found.`, "error"); return; }
      try {
        for (const item of toInsert) await fetch("/api/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) });
        showToast(skipped.length ? `Imported ${toInsert.length} notes. Skipped ${skipped.length} duplicate(s).` : `Imported ${toInsert.length} notes successfully.`);
        fetchNotes();
      } catch { showToast("Import failed", "error"); }
    };
    reader.readAsBinaryString(file); event.target.value = "";
  }
  // ── Excel Export ────────────────────────────────────────────────────────
  function exportToExcel() {
    const data = filtered.map((note) => ({
      Title:    note.title,
      Content:  note.content || "",
      Category: note.category || "General",
      Pinned:   note.pinned ? "Yes" : "No",
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Notes");
    saveAs(new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], { type: "application/octet-stream" }), "notes.xlsx");
  }
  const pinnedNotes = filtered.filter((n) => n.pinned);
  const unpinnedNotes = filtered.filter((n) => !n.pinned);
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">📝 Notes</h1>
            <p className="text-sm text-gray-500 mt-1">{notes.length} notes across {uniqueCategories.length} categories</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { setFormOpen((o) => !o); if (formOpen) resetForm(); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              {formOpen ? "✕ Close Form" : "+ Add Note"}
            </button>
            <label className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors">
              ↑ Import Excel<input type="file" accept=".xlsx,.xls" hidden onChange={handleExcelImport} />
            </label>
            <button onClick={exportToExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              ↓ Export ({filtered.length})
            </button>
          </div>
        </div>
        {/* Form */}
        {formOpen && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">{editingId ? "✏️ Edit Note" : "➕ Add New Note"}</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Title *</label>
                  <input value={formData.title} onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))} placeholder="Note title" required className={inputCls} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</label>
                  <input list="cat-list" value={formData.category} onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))} placeholder="e.g. General, Web Dev, Ideas" className={inputCls} />
                  <datalist id="cat-list">{uniqueCategories.map((c) => <option key={c} value={c} />)}</datalist>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Content</label>
                <textarea value={formData.content} onChange={(e) => setFormData((p) => ({ ...p, content: e.target.value }))} placeholder="Write your note here… (supports plain text, links, etc.)" rows={6} className={`${inputCls} resize-y`} />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.pinned} onChange={(e) => setFormData((p) => ({ ...p, pinned: e.target.checked }))} className="w-4 h-4 accent-yellow-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">📌 Pin this note</span>
                </label>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={submitting} className="flex-1 sm:flex-none sm:w-40 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 px-4 rounded-lg text-sm font-medium">
                  {submitting ? "Saving…" : editingId ? "Update" : "Add Note"}
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
              <input type="text" placeholder="Search notes…" value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => setSelectedCategory("")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${!selectedCategory ? "bg-gray-700 text-white border-gray-700" : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
                All
              </button>
              {uniqueCategories.map((c) => {
                const color = categoryColorMap[c] || CATEGORY_COLORS[0];
                const isSelected = selectedCategory === c;
                return (
                  <button key={c} onClick={() => setSelectedCategory(selectedCategory === c ? "" : c)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${isSelected ? `${color.bg} ${color.text} border-transparent font-bold` : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />{c}
                  </button>
                );
              })}
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Showing {filtered.length} of {notes.length} notes</p>
        </div>
        {/* Notes Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400"><span className="animate-spin mr-2">⟳</span> Loading notes…</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-sm">No notes found.</p>
            <button onClick={() => setFormOpen(true)} className="mt-4 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg">Add First Note</button>
          </div>
        ) : (
          <>
            {pinnedNotes.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xs font-bold uppercase tracking-wider text-yellow-600 dark:text-yellow-400 mb-3 flex items-center gap-1.5">
                  <span>📌</span> Pinned
                </h2>
                <NoteCards notes={pinnedNotes} categoryColorMap={categoryColorMap} onEdit={handleEdit} onDelete={handleDelete} onPin={togglePin} />
              </div>
            )}
            {unpinnedNotes.length > 0 && (
              <div>
                {pinnedNotes.length > 0 && <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Other Notes</h2>}
                <NoteCards notes={unpinnedNotes} categoryColorMap={categoryColorMap} onEdit={handleEdit} onDelete={handleDelete} onPin={togglePin} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
function NoteCards({ notes, categoryColorMap, onEdit, onDelete, onPin }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {notes.map((note) => {
        const color = categoryColorMap[note.category] || CATEGORY_COLORS[0];
        return (
          <div key={note._id} className={`bg-white dark:bg-gray-900 border-2 ${note.pinned ? color.card : "border-gray-200 dark:border-gray-800"} rounded-xl p-4 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow`}>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug flex-1">{note.title}</h3>
              <button onClick={() => onPin(note)} title={note.pinned ? "Unpin" : "Pin"} className={`text-lg leading-none flex-shrink-0 transition-opacity ${note.pinned ? "opacity-100" : "opacity-30 hover:opacity-60"}`}>📌</button>
            </div>
            <span className={`self-start inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded ${color.bg} ${color.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />{note.category || "General"}
            </span>
            {note.content && (
              <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed line-clamp-5 whitespace-pre-wrap flex-1">{note.content}</p>
            )}
            <div className="flex items-center justify-between gap-2 pt-1 border-t dark:border-gray-800">
              <span className="text-xs text-gray-400">{new Date(note.updatedAt).toLocaleDateString()}</span>
              <div className="flex gap-1.5">
                <button onClick={() => onEdit(note)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2.5 py-1 rounded transition-colors">Edit</button>
                <button onClick={() => onDelete(note._id)} className="bg-red-500 hover:bg-red-600 text-white text-xs px-2.5 py-1 rounded transition-colors">Delete</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}