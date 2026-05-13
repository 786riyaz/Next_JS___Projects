// app/priorities/page.js
"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import ComboBox from "@/components/ComboBox";
import moduleOrder from "../moduleOrder.js";
import { DOMAIN_COLORS, buildDomainColorMap } from "@/lib/domainColors";

const DOMAIN_ORDER = moduleOrder.DOMAIN_ORDER;
const norm = (s) => s.toLowerCase().replace(/[\s/]/g, "");
const DOMAIN_ORDER_NORM = DOMAIN_ORDER.map(norm);

function domainIndex(d) {
  const n = norm(d);
  const i = DOMAIN_ORDER_NORM.indexOf(n);
  return i === -1 ? 999 : i;
}
function sortDomains(domains) {
  return [...domains].sort((a, b) => {
    const ai = domainIndex(a), bi = domainIndex(b);
    if (ai === bi) return a.localeCompare(b);
    return ai - bi;
  });
}
function SortIcon({ field, sortConfig }) {
  if (sortConfig.field !== field) return <span className="ml-1 text-gray-400 text-xs">↕</span>;
  return <span className="ml-1 text-xs">{sortConfig.dir === "asc" ? "↑" : "↓"}</span>;
}
function getPaginationRange(current, total) {
  const maxVisible = 10;
  if (total <= maxVisible) return Array.from({ length: total }, (_, i) => i + 1);
  let start = Math.max(1, current - Math.floor(maxVisible / 2));
  let end = start + maxVisible - 1;
  if (end > total) { end = total; start = Math.max(1, end - maxVisible + 1); }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

const inputCls = "border dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 pr-8 rounded-lg text-sm text-gray-900 dark:text-white w-full";

export default function PrioritiesPage() {
  const [priorities, setPriorities] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const emptyForm = { domain: "", topic: "", moduleOrder: "", learnPriority: "" };
  const [formData, setFormData] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("");
  const [sortConfig, setSortConfig] = useState({ field: "learnPriority", dir: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  async function fetchPriorities() {
    setLoading(true);
    try {
      const res = await fetch("/api/priorities");
      setPriorities(await res.json());
    } catch { showToast("Failed to load priorities", "error"); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchPriorities(); /* eslint-disable-next-line */ }, []);

  const uniqueDomains = useMemo(() =>
    sortDomains([...new Set(priorities.map((p) => p.domain).filter(Boolean))]),
    [priorities]
  );

  const domainColorMap = useMemo(() => buildDomainColorMap(uniqueDomains), [uniqueDomains]);

  const uniqueTopicsForDomain = useMemo(() => {
    const source = formData.domain ? priorities.filter((p) => p.domain === formData.domain) : priorities;
    return [...new Set(source.map((p) => p.topic).filter(Boolean))].sort();
  }, [priorities, formData.domain]);

  function isDuplicateDomainTopic(domain, topic, excludeId = null) {
    return priorities.some(
      (p) => p.domain.trim().toLowerCase() === domain.trim().toLowerCase()
        && p.topic.trim().toLowerCase() === topic.trim().toLowerCase()
        && p._id !== excludeId
    );
  }
  function isDuplicateLearnPriority(learnPriority, excludeId = null) {
    return priorities.some((p) => Number(p.learnPriority) === Number(learnPriority) && p._id !== excludeId);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "domain") {
      setFormData((prev) => ({ ...prev, domain: value, topic: "", moduleOrder: "", learnPriority: "" }));
      return;
    }
    if (name === "topic") {
      const existing = priorities.find(
        (p) => p.domain.trim().toLowerCase() === formData.domain.trim().toLowerCase()
          && p.topic.trim().toLowerCase() === value.trim().toLowerCase()
          && p._id !== editingId
      );
      if (existing) {
        setFormData((prev) => ({ ...prev, topic: value, moduleOrder: existing.moduleOrder, learnPriority: existing.learnPriority }));
      } else {
        setFormData((prev) => ({ ...prev, topic: value }));
      }
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    const payload = { ...formData, moduleOrder: Number(formData.moduleOrder), learnPriority: Number(formData.learnPriority) };
    if (isDuplicateDomainTopic(formData.domain, formData.topic, editingId)) {
      showToast(`⚠️ Duplicate! Topic "${formData.topic}" already exists in domain "${formData.domain}".`, "error");
      setSubmitting(false); return;
    }
    if (isDuplicateLearnPriority(formData.learnPriority, editingId)) {
      showToast(`⚠️ Duplicate! Learn Priority "${formData.learnPriority}" is already assigned.`, "error");
      setSubmitting(false); return;
    }
    try {
      const res = editingId
        ? await fetch(`/api/priorities/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/priorities", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) { showToast(editingId ? "Priority updated!" : "Priority added!"); resetForm(); fetchPriorities(); }
      else showToast("Save failed", "error");
    } catch { showToast("Network error", "error"); }
    finally { setSubmitting(false); }
  }

  function handleEdit(item) {
    setEditingId(item._id);
    setFormData({ domain: item.domain, topic: item.topic, moduleOrder: item.moduleOrder, learnPriority: item.learnPriority });
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this priority?")) return;
    try {
      const res = await fetch(`/api/priorities/${id}`, { method: "DELETE" });
      if (res.ok) { showToast("Priority deleted"); fetchPriorities(); }
    } catch { showToast("Delete failed", "error"); }
  }

  function resetForm() { setEditingId(null); setFormData(emptyForm); setFormOpen(false); }

  function handleSort(field) {
    setSortConfig((prev) => prev.field === field ? { field, dir: prev.dir === "asc" ? "desc" : "asc" } : { field, dir: "asc" });
    setCurrentPage(1);
  }

  // ── Up/Down reorder: swap learnPriority values between two rows ──────────
  async function handleReorder(item, direction) {
    const list = filteredSorted; // current sorted view
    const idx = list.findIndex((p) => p._id === item._id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= list.length) return;

    const other = list[swapIdx];
    // Swap learnPriority values
    const [newA, newB] = [other.learnPriority, item.learnPriority];
    try {
      await Promise.all([
        fetch(`/api/priorities/${item._id}`,  { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...item,  learnPriority: newA }) }),
        fetch(`/api/priorities/${other._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...other, learnPriority: newB }) }),
      ]);
      // Optimistic update in local state
      setPriorities((prev) => prev.map((p) => {
        if (p._id === item._id)  return { ...p, learnPriority: newA };
        if (p._id === other._id) return { ...p, learnPriority: newB };
        return p;
      }));
    } catch { showToast("Reorder failed", "error"); }
  }

  const filteredSorted = useMemo(() => {
    let list = priorities.filter((item) => {
      const q = search.toLowerCase();
      const matchSearch = !q || item.domain?.toLowerCase().includes(q) || item.topic?.toLowerCase().includes(q);
      const matchDomain = !selectedDomain || item.domain === selectedDomain;
      return matchSearch && matchDomain;
    });
    list = [...list].sort((a, b) => {
      let av = a[sortConfig.field] ?? "", bv = b[sortConfig.field] ?? "";
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av < bv) return sortConfig.dir === "asc" ? -1 : 1;
      if (av > bv) return sortConfig.dir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [priorities, search, selectedDomain, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filteredSorted.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);
  const pageNumbers = getPaginationRange(safePage, totalPages);
  useEffect(() => { setCurrentPage(1); }, [search, selectedDomain, sortConfig]);

  const domainCount = uniqueDomains.length;
  const topicCount = priorities.length;

  async function handleExcelImport(event) {
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const workbook = XLSX.read(e.target.result, { type: "binary" });
      const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
      const formatted = json.map((item) => ({
        domain: String(item.Domain || "").trim(),
        topic: String(item.Topic || "").trim(),
        moduleOrder: Number(item["Module Order"] || 0),
        learnPriority: Number(item["Learn Priority"] || 0),
      })).filter((item) => item.topic && item.domain);
      const seenDomainTopics = new Set(priorities.map((p) => `${p.domain.trim().toLowerCase()}::${p.topic.trim().toLowerCase()}`));
      const seenPriorities = new Set(priorities.map((p) => Number(p.learnPriority)));
      const skipped = [], toInsert = [];
      for (const item of formatted) {
        const compositeKey = `${item.domain.toLowerCase()}::${item.topic.toLowerCase()}`;
        const prioVal = Number(item.learnPriority);
        if (seenDomainTopics.has(compositeKey)) skipped.push(`${item.topic} in ${item.domain} (duplicate topic in same domain)`);
        else if (seenPriorities.has(prioVal)) skipped.push(item.topic + " (duplicate priority)");
        else { toInsert.push(item); seenDomainTopics.add(compositeKey); seenPriorities.add(prioVal); }
      }
      if (!toInsert.length) { showToast(`⚠️ All ${formatted.length} rows skipped — duplicates found.`, "error"); return; }
      try {
        for (const item of toInsert) await fetch("/api/priorities", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) });
        showToast(skipped.length ? `Imported ${toInsert.length} priorities. Skipped ${skipped.length} duplicate(s).` : `Imported ${toInsert.length} priorities successfully.`);
        fetchPriorities();
      } catch { showToast("Import failed", "error"); }
    };
    reader.readAsBinaryString(file); event.target.value = "";
  }

  function exportToExcel() {
    const data = filteredSorted.map((item) => ({ Domain: item.domain, Topic: item.topic, "Module Order": item.moduleOrder, "Learn Priority": item.learnPriority }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Priorities");
    saveAs(new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], { type: "application/octet-stream" }), "priorities.xlsx");
  }

  const topicHasSavedData = formData.topic && formData.domain && !editingId &&
    priorities.find((p) => p.domain.trim().toLowerCase() === formData.domain.trim().toLowerCase()
      && p.topic.trim().toLowerCase() === formData.topic.trim().toLowerCase());

  // Up/down only works when sorted by learnPriority asc (natural order)
  const isReorderMode = sortConfig.field === "learnPriority" && sortConfig.dir === "asc" && !search && !selectedDomain;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium max-w-sm ${toast.type === "error" ? "bg-red-600" : toast.type === "warn" ? "bg-yellow-500" : "bg-green-600"}`}>
          {toast.msg}
        </div>
      )}
      <div className="p-6 max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">📋 Domain Priorities</h1>
            <p className="text-sm text-gray-500 mt-1">{topicCount} topics across {domainCount} domains</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { setFormOpen((o) => !o); if (formOpen) resetForm(); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              {formOpen ? "✕ Close Form" : "+ Add Priority"}
            </button>
            <label className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors">
              ↑ Import Excel<input type="file" accept=".xlsx,.xls" hidden onChange={handleExcelImport} />
            </label>
            <button onClick={exportToExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              ↓ Export ({filteredSorted.length})
            </button>
          </div>
        </div>

        {/* Form */}
        {formOpen && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">{editingId ? "✏️ Edit Priority" : "➕ Add New Priority"}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Domain *</label>
                <ComboBox name="domain" value={formData.domain} onChange={handleChange} options={uniqueDomains} placeholder="Search or type domain…" required className={inputCls} />
                {formData.domain && !uniqueDomains.find((d) => d.toLowerCase() === formData.domain.toLowerCase()) && (
                  <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">✦ New domain will be created</p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Topic *</label>
                <ComboBox name="topic" value={formData.topic} onChange={handleChange} options={uniqueTopicsForDomain} placeholder="Search or type topic…" required className={inputCls} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Module Order *</label>
                <input type="number" step="0.1" name="moduleOrder" placeholder="e.g. 1.2" value={formData.moduleOrder} onChange={handleChange} required
                  className={`border dark:border-gray-700 p-2.5 rounded-lg text-sm w-full ${topicHasSavedData ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700" : "bg-white dark:bg-gray-800"} text-gray-900 dark:text-white`} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Learn Priority *</label>
                <input type="number" name="learnPriority" placeholder="e.g. 5" value={formData.learnPriority} onChange={handleChange} required
                  className={`border dark:border-gray-700 p-2.5 rounded-lg text-sm w-full ${topicHasSavedData ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700" : "bg-white dark:bg-gray-800"} text-gray-900 dark:text-white`} />
              </div>
              <div className="flex gap-3 sm:col-span-2 lg:col-span-4">
                <button type="submit" disabled={submitting} className="flex-1 sm:flex-none sm:w-40 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 px-4 rounded-lg text-sm font-medium">
                  {submitting ? "Saving…" : editingId ? "Update" : "Add Priority"}
                </button>
                <button type="button" onClick={resetForm} className="flex-1 sm:flex-none sm:w-32 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white py-2.5 px-4 rounded-lg text-sm font-medium">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 mb-4 shadow-sm">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input type="text" placeholder="Search domain or topic…" value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => setSelectedDomain("")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${!selectedDomain ? "bg-gray-700 text-white border-gray-700" : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
                All Domains
              </button>
              {uniqueDomains.map((d) => {
                const color = domainColorMap[d] || DOMAIN_COLORS[0];
                const isSelected = selectedDomain === d;
                return (
                  <button key={d} onClick={() => setSelectedDomain(selectedDomain === d ? "" : d)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${isSelected ? `${color.bg} ${color.text} border-transparent font-bold` : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />{d}
                  </button>
                );
              })}
            </div>
          </div>
          {(search || selectedDomain) && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t dark:border-gray-800">
              {search && <span className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs px-2 py-1 rounded-full">Search: {search}<button onClick={() => setSearch("")} className="ml-1 hover:text-red-500">✕</button></span>}
              {selectedDomain && <span className="inline-flex items-center gap-1 bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 text-xs px-2 py-1 rounded-full">Domain: {selectedDomain}<button onClick={() => setSelectedDomain("")} className="ml-1 hover:text-red-500">✕</button></span>}
              <button onClick={() => { setSearch(""); setSelectedDomain(""); }} className="text-xs text-gray-500 hover:text-red-500 underline">Clear all</button>
            </div>
          )}
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-400">Showing {filteredSorted.length} of {topicCount} priorities</p>
            {!isReorderMode && (
              <p className="text-xs text-amber-500">⚠ Clear filters &amp; sort by Learn Priority ↑ to enable reorder buttons</p>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400"><span className="animate-spin mr-2">⟳</span> Loading priorities…</div>
          ) : paginated.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-sm">No priorities found.</p>
              <button onClick={() => setFormOpen(true)} className="mt-4 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg">Add First Priority</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-left">
                    <th className="px-4 py-3 font-semibold text-center w-10">#</th>
                    <th className="px-4 py-3 font-semibold cursor-pointer hover:text-blue-600 select-none whitespace-nowrap" onClick={() => handleSort("domain")}>Domain <SortIcon field="domain" sortConfig={sortConfig} /></th>
                    <th className="px-4 py-3 font-semibold cursor-pointer hover:text-blue-600 select-none whitespace-nowrap" onClick={() => handleSort("topic")}>Topic <SortIcon field="topic" sortConfig={sortConfig} /></th>
                    <th className="px-4 py-3 font-semibold cursor-pointer hover:text-blue-600 select-none whitespace-nowrap" onClick={() => handleSort("moduleOrder")}>Module Order <SortIcon field="moduleOrder" sortConfig={sortConfig} /></th>
                    <th className="px-4 py-3 font-semibold cursor-pointer hover:text-blue-600 select-none whitespace-nowrap" onClick={() => handleSort("learnPriority")}>Learn Priority <SortIcon field="learnPriority" sortConfig={sortConfig} /></th>
                    <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {paginated.map((item, idx) => {
                    const color = domainColorMap[item.domain] || DOMAIN_COLORS[0];
                    const globalIdx = (safePage - 1) * itemsPerPage + idx;
                    return (
                      <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-3 text-center text-xs text-gray-400">{globalIdx + 1}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded ${color.bg} ${color.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />{item.domain}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.topic}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.moduleOrder}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full ${item.learnPriority <= 3 ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400" : item.learnPriority <= 6 ? "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400" : "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"}`}>
                            {item.learnPriority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5 justify-end items-center">
                            {/* Up/Down reorder — only shown in natural sort mode */}
                            {isReorderMode && (
                              <>
                                <button
                                  onClick={() => handleReorder(item, "up")}
                                  disabled={globalIdx === 0}
                                  title="Move up"
                                  className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-30 text-gray-700 dark:text-gray-300 text-xs px-2 py-1.5 rounded transition-colors"
                                >▲</button>
                                <button
                                  onClick={() => handleReorder(item, "down")}
                                  disabled={globalIdx === filteredSorted.length - 1}
                                  title="Move down"
                                  className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-30 text-gray-700 dark:text-gray-300 text-xs px-2 py-1.5 rounded transition-colors"
                                >▼</button>
                              </>
                            )}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
            <p className="text-xs text-gray-500">Page {safePage} of {totalPages} ({filteredSorted.length} results)</p>
            <div className="flex flex-wrap gap-1">
              <button onClick={() => setCurrentPage(1)} disabled={safePage === 1} className="px-2 py-1.5 rounded text-xs bg-gray-200 dark:bg-gray-800 disabled:opacity-40">«</button>
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={safePage === 1} className="px-2 py-1.5 rounded text-xs bg-gray-200 dark:bg-gray-800 disabled:opacity-40">‹</button>
              {pageNumbers[0] > 1 && <span className="px-2 py-1.5 text-xs text-gray-400">…</span>}
              {pageNumbers.map((p) => (
                <button key={p} onClick={() => setCurrentPage(p)} className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${p === safePage ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300"}`}>{p}</button>
              ))}
              {pageNumbers[pageNumbers.length - 1] < totalPages && <span className="px-2 py-1.5 text-xs text-gray-400">…</span>}
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="px-2 py-1.5 rounded text-xs bg-gray-200 dark:bg-gray-800 disabled:opacity-40">›</button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={safePage === totalPages} className="px-2 py-1.5 rounded text-xs bg-gray-200 dark:bg-gray-800 disabled:opacity-40">»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}