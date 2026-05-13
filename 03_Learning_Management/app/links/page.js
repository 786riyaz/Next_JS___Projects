// app/links/page.js
"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
const LINK_COLORS = [
  { bg: "bg-indigo-100 dark:bg-indigo-900/50", text: "text-indigo-700 dark:text-indigo-300", dot: "bg-indigo-500" },
  { bg: "bg-emerald-100 dark:bg-emerald-900/50", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
  { bg: "bg-orange-100 dark:bg-orange-900/50", text: "text-orange-700 dark:text-orange-300", dot: "bg-orange-500" },
  { bg: "bg-pink-100 dark:bg-pink-900/50", text: "text-pink-700 dark:text-pink-300", dot: "bg-pink-500" },
  { bg: "bg-violet-100 dark:bg-violet-900/50", text: "text-violet-700 dark:text-violet-300", dot: "bg-violet-500" },
  { bg: "bg-cyan-100 dark:bg-cyan-900/50", text: "text-cyan-700 dark:text-cyan-300", dot: "bg-cyan-500" },
  { bg: "bg-amber-100 dark:bg-amber-900/50", text: "text-amber-700 dark:text-amber-300", dot: "bg-amber-500" },
  { bg: "bg-teal-100 dark:bg-teal-900/50", text: "text-teal-700 dark:text-teal-300", dot: "bg-teal-500" },
  { bg: "bg-rose-100 dark:bg-rose-900/50", text: "text-rose-700 dark:text-rose-300", dot: "bg-rose-500" },
  { bg: "bg-sky-100 dark:bg-sky-900/50", text: "text-sky-700 dark:text-sky-300", dot: "bg-sky-500" },
];
const inputCls = "border dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 rounded-lg text-sm text-gray-900 dark:text-white w-full outline-none";
function SortIcon({ field, sortConfig }) {
  if (sortConfig.field !== field) return <span className="ml-1 text-gray-400 text-xs">↕</span>;
  return <span className="ml-1 text-xs">{sortConfig.dir === "asc" ? "↑" : "↓"}</span>;
}
export default function LinksPage() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortConfig, setSortConfig] = useState({ field: null, dir: "asc" });
  const emptyForm = { category: "", topic: "", subtopic: "", reference: "" };
  const [formData, setFormData] = useState(emptyForm);
  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);
  async function fetchLinks() {
    setLoading(true);
    try { const res = await fetch("/api/links"); setLinks(await res.json()); }
    catch { showToast("Failed to load links", "error"); }
    finally { setLoading(false); }
  }
  useEffect(() => { fetchLinks(); /* eslint-disable-next-line */ }, []);
  const uniqueCategories = useMemo(() => [...new Set(links.map((l) => l.category).filter(Boolean))].sort(), [links]);
  const categoryColorMap = useMemo(() => {
    const map = {};
    uniqueCategories.forEach((c, i) => { map[c] = LINK_COLORS[i % LINK_COLORS.length]; });
    return map;
  }, [uniqueCategories]);
  const uniqueTopics = useMemo(() => {
    const source = selectedCategory ? links.filter((l) => l.category === selectedCategory) : links;
    return [...new Set(source.map((l) => l.topic).filter(Boolean))].sort();
  }, [links, selectedCategory]);
  function handleSort(field) {
    setSortConfig((prev) => prev.field === field ? { field, dir: prev.dir === "asc" ? "desc" : "asc" } : { field, dir: "asc" });
  }
  const filtered = useMemo(() => {
    let list = links.filter((l) => {
      const q = search.toLowerCase();
      const matchSearch = !q || l.category?.toLowerCase().includes(q) || l.topic?.toLowerCase().includes(q) || l.subtopic?.toLowerCase().includes(q) || l.reference?.toLowerCase().includes(q);
      const matchCat = !selectedCategory || l.category === selectedCategory;
      return matchSearch && matchCat;
    });
    if (sortConfig.field) {
      list = [...list].sort((a, b) => {
        let av = (a[sortConfig.field] || "").toLowerCase();
        let bv = (b[sortConfig.field] || "").toLowerCase();
        if (av < bv) return sortConfig.dir === "asc" ? -1 : 1;
        if (av > bv) return sortConfig.dir === "asc" ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [links, search, selectedCategory, sortConfig]);
  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.category || !formData.topic || !formData.reference) { showToast("Category, Topic and Reference are required", "error"); return; }
    setSubmitting(true);
    try {
      const res = editingId
        ? await fetch(`/api/links/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) })
        : await fetch("/api/links", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      if (res.ok) { showToast(editingId ? "Link updated!" : "Link added!"); resetForm(); fetchLinks(); }
      else showToast("Save failed", "error");
    } catch { showToast("Network error", "error"); }
    finally { setSubmitting(false); }
  }
  function handleEdit(item) {
    setEditingId(item._id);
    setFormData({ category: item.category, topic: item.topic, subtopic: item.subtopic || "", reference: item.reference });
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function handleDelete(id) {
    if (!window.confirm("Delete this link?")) return;
    try { const res = await fetch(`/api/links/${id}`, { method: "DELETE" }); if (res.ok) { showToast("Link deleted"); fetchLinks(); } }
    catch { showToast("Delete failed", "error"); }
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
        category:  String(item.Category  || "").trim(),
        topic:     String(item.Topic     || "").trim(),
        subtopic:  String(item.Subtopic  || "").trim(),
        reference: String(item.Reference || "").trim(),
      })).filter((item) => item.category && item.topic && item.reference);
      const existingRefs = new Set(links.map((l) => l.reference.trim().toLowerCase()));
      const skipped = [], toInsert = [];
      for (const item of formatted) {
        const refKey = item.reference.toLowerCase();
        if (existingRefs.has(refKey)) skipped.push(item.topic + " (duplicate reference)");
        else { toInsert.push(item); existingRefs.add(refKey); }
      }
      if (!toInsert.length) { showToast(`⚠️ All ${formatted.length} rows skipped — duplicates found.`, "error"); return; }
      try {
        for (const item of toInsert) await fetch("/api/links", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) });
        showToast(skipped.length ? `Imported ${toInsert.length} links. Skipped ${skipped.length} duplicate(s).` : `Imported ${toInsert.length} links successfully.`);
        fetchLinks();
      } catch { showToast("Import failed", "error"); }
    };
    reader.readAsBinaryString(file); event.target.value = "";
  }
  // ── Excel Export ────────────────────────────────────────────────────────
  function exportToExcel() {
    const data = filtered.map((item) => ({ Category: item.category, Topic: item.topic, Subtopic: item.subtopic || "", Reference: item.reference }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Links");
    saveAs(new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], { type: "application/octet-stream" }), "links.xlsx");
  }
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium max-w-sm ${toast.type === "error" ? "bg-red-600" : "bg-green-600"}`}>
          {toast.msg}
        </div>
      )}
      <div className="p-6 max-w-screen-xl mx-auto">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">🔗 Other Learning Links</h1>
            <p className="text-sm text-gray-500 mt-1">{links.length} links across {uniqueCategories.length} categories</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { setFormOpen((o) => !o); if (formOpen) resetForm(); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              {formOpen ? "✕ Close Form" : "+ Add Link"}
            </button>
            <label className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors">
              ↑ Import Excel<input type="file" accept=".xlsx,.xls" hidden onChange={handleExcelImport} />
            </label>
            <button onClick={exportToExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              ↓ Export ({filtered.length})
            </button>
          </div>
        </div>
        {/* ── Form ── */}
        {formOpen && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">{editingId ? "✏️ Edit Link" : "➕ Add New Link"}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Category *</label>
                <input list="cat-list" name="category" value={formData.category} onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))} placeholder="e.g. API Design, Security" required className={inputCls} />
                <datalist id="cat-list">{uniqueCategories.map((c) => <option key={c} value={c} />)}</datalist>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Topic *</label>
                <input list="topic-list" name="topic" value={formData.topic} onChange={(e) => setFormData((p) => ({ ...p, topic: e.target.value }))} placeholder="e.g. APIs, JWT, Webhooks" required className={inputCls} />
                <datalist id="topic-list">{uniqueTopics.map((t) => <option key={t} value={t} />)}</datalist>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Subtopic / Description</label>
                <input name="subtopic" value={formData.subtopic} onChange={(e) => setFormData((p) => ({ ...p, subtopic: e.target.value }))} placeholder="Brief description of the resource" className={inputCls} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Reference URL *</label>
                <input type="url" name="reference" value={formData.reference} onChange={(e) => setFormData((p) => ({ ...p, reference: e.target.value }))} placeholder="https://..." required className={inputCls} />
              </div>
              <div className="flex gap-3 sm:col-span-2">
                <button type="submit" disabled={submitting} className="flex-1 sm:flex-none sm:w-40 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 px-4 rounded-lg text-sm font-medium transition-colors">
                  {submitting ? "Saving…" : editingId ? "Update" : "Add Link"}
                </button>
                <button type="button" onClick={resetForm} className="flex-1 sm:flex-none sm:w-32 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white py-2.5 px-4 rounded-lg text-sm font-medium transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
        {/* ── Filters ── */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 mb-4 shadow-sm">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input type="text" placeholder="Search category, topic, description…" value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => setSelectedCategory("")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${!selectedCategory ? "bg-gray-700 text-white border-gray-700" : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
                All Categories
              </button>
              {uniqueCategories.map((c) => {
                const color = categoryColorMap[c] || LINK_COLORS[0];
                const isSelected = selectedCategory === c;
                return (
                  <button key={c} onClick={() => setSelectedCategory(selectedCategory === c ? "" : c)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${isSelected ? `${color.bg} ${color.text} border-transparent font-bold` : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Showing {filtered.length} of {links.length} links</p>
        </div>
        {/* ── Table ── */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400"><span className="animate-spin mr-2">⟳</span> Loading links…</div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              <div className="text-4xl mb-3">🔗</div>
              <p className="text-sm">No links found.</p>
              <button onClick={() => setFormOpen(true)} className="mt-4 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg">Add First Link</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-left">
                    <th className="px-4 py-3 font-semibold w-8">#</th>
                    <th className="px-4 py-3 font-semibold cursor-pointer hover:text-blue-600 select-none whitespace-nowrap" onClick={() => handleSort("category")}>
                      Category <SortIcon field="category" sortConfig={sortConfig} />
                    </th>
                    <th className="px-4 py-3 font-semibold cursor-pointer hover:text-blue-600 select-none whitespace-nowrap" onClick={() => handleSort("topic")}>
                      Topic <SortIcon field="topic" sortConfig={sortConfig} />
                    </th>
                    <th className="px-4 py-3 font-semibold cursor-pointer hover:text-blue-600 select-none whitespace-nowrap" onClick={() => handleSort("subtopic")}>
                      Subtopic / Description <SortIcon field="subtopic" sortConfig={sortConfig} />
                    </th>
                    <th className="px-4 py-3 font-semibold">Reference</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filtered.map((item, idx) => {
                    const color = categoryColorMap[item.category] || LINK_COLORS[0];
                    return (
                      <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-3 text-xs text-gray-400">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded ${color.bg} ${color.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />{item.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.topic}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-xs">{item.subtopic || <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                        <td className="px-4 py-3">
                          <a href={item.reference} target="_blank" rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline text-xs break-all max-w-xs block truncate"
                            title={item.reference}>{item.reference}</a>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => handleEdit(item)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded transition-colors">Edit</button>
                            <button onClick={() => handleDelete(item._id)} className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded transition-colors">Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}