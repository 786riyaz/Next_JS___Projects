// app\videos\page.js
"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import ComboBox from "@/components/ComboBox";

function SortIcon({ field, sortConfig }) {
  if (sortConfig.field !== field) return <span className="ml-1 text-gray-400">↕</span>;
  return <span className="ml-1">{sortConfig.dir === "asc" ? "↑" : "↓"}</span>;
}
function getPaginationRange(current, total) {
  const maxVisible = 10;
  if (total <= maxVisible) return Array.from({ length: total }, (_, i) => i + 1);
  let start = Math.max(1, current - Math.floor(maxVisible / 2));
  let end   = start + maxVisible - 1;
  if (end > total) { end = total; start = Math.max(1, end - maxVisible + 1); }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}
const inputCls = "border dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 pr-8 rounded-lg text-sm text-gray-900 dark:text-white w-full";

export default function VideosPage() {
  const [videos, setVideos]         = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [editingId, setEditingId]   = useState(null);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]           = useState(null);

  // filters
  const [search, setSearch]               = useState("");
  const [selectedDomain, setSelectedDomain] = useState("");
  const [selectedTopic, setSelectedTopic]   = useState("");
  const [selectedSeries, setSelectedSeries] = useState("");
  const [downloadFilter, setDownloadFilter] = useState("all");

  const [sortConfig, setSortConfig] = useState({ field: "priority", dir: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const emptyForm = { priority: "", topic: "", videoName: "", channelName: "", youtubeLink: "", series: "", downloaded: false };
  const [formData, setFormData] = useState(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  // form-level domain selector (not stored, just for filtering topics in form)
  const [formDomain, setFormDomain] = useState("");

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ─── Build lookup maps from priorities ───────────────────────────────────
  const topicDomainMap = useMemo(() => {
    const map = {};
    priorities.forEach((p) => { if (p.topic) map[p.topic] = p.domain || ""; });
    return map;
  }, [priorities]);

  // topic → learnPriority map (live sync)
  const topicPriorityMap = useMemo(() => {
    const map = {};
    priorities.forEach((p) => { if (p.topic) map[p.topic] = p.learnPriority; });
    return map;
  }, [priorities]);

  // ─── Fetch ───────────────────────────────────────────────────────────────
  async function fetchVideos() {
    setLoading(true);
    try {
      const res  = await fetch("/api/videos");
      const data = await res.json();
      setVideos(data);
    } catch { showToast("Failed to load videos", "error"); }
    finally  { setLoading(false); }
  }
  async function fetchPriorities() {
    try {
      const res  = await fetch("/api/priorities");
      const data = await res.json();
      setPriorities(data);
    } catch { showToast("Failed to load priorities", "error"); }
  }
  useEffect(() => { fetchVideos(); fetchPriorities(); /* eslint-disable-next-line */ }, []);

  // ─── Derived option lists ─────────────────────────────────────────────────
  const uniqueDomains = useMemo(() => {
    const d = new Set(priorities.map((p) => p.domain).filter(Boolean));
    return [...d].sort();
  }, [priorities]);

  // Topics in form filtered by formDomain
  const formTopicOptions = useMemo(() => {
    const source = formDomain
      ? priorities.filter((p) => p.domain === formDomain)
      : priorities;
    return [...new Set(source.map((p) => p.topic).filter(Boolean))].sort();
  }, [priorities, formDomain]);

  // Topics in filter bar filtered by selectedDomain
  const filterTopicOptions = useMemo(() => {
    return priorities
      .filter((p) => !selectedDomain || p.domain === selectedDomain)
      .map((p) => p.topic);
  }, [priorities, selectedDomain]);

  const uniqueChannels = useMemo(() => [...new Set(videos.map((v) => v.channelName).filter(Boolean))].sort(), [videos]);
  const uniqueSeries   = useMemo(() => [...new Set(videos.map((v) => v.series).filter(Boolean))].sort(), [videos]);

  // auto-filled domain for current form topic
  const autoFilledDomain = topicDomainMap[formData.topic] || formDomain || "";

  // ─── Duplicate helpers ────────────────────────────────────────────────────
  function normalizeYtUrl(url) {
    try { const u = new URL(url); const v = u.searchParams.get("v"); return v ? v : url.trim().toLowerCase(); }
    catch { return url.trim().toLowerCase(); }
  }
  function isDuplicateVideo(youtubeLink, videoName, excludeId = null) {
    const normUrl  = normalizeYtUrl(youtubeLink);
    const normName = videoName.trim().toLowerCase();
    return videos.find((v) => v._id !== excludeId && (normalizeYtUrl(v.youtubeLink) === normUrl || v.videoName.trim().toLowerCase() === normName));
  }

  // ─── Form handlers ────────────────────────────────────────────────────────
  function handleFormDomainChange(e) {
    const domain = e.target.value;
    setFormDomain(domain);
    // clear topic if it doesn't belong to new domain
    const topicsInDomain = priorities.filter((p) => p.domain === domain).map((p) => p.topic);
    if (domain && !topicsInDomain.includes(formData.topic)) {
      setFormData((prev) => ({ ...prev, topic: "", priority: "" }));
    }
  }

  function handleChange(e) {
    const { name, value, checked, type } = e.target;
    if (name === "topic") {
      const priority = topicPriorityMap[value] ?? formData.priority;
      const domain   = topicDomainMap[value] || formDomain;
      setFormDomain(domain);
      setFormData((prev) => ({ ...prev, topic: value, priority }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.topic || !formData.videoName || !formData.youtubeLink) {
      showToast("Please fill Topic, Video Name and YouTube Link", "error"); return;
    }
    const dupEntry = isDuplicateVideo(formData.youtubeLink, formData.videoName, editingId);
    if (dupEntry) {
      const reason = normalizeYtUrl(dupEntry.youtubeLink) === normalizeYtUrl(formData.youtubeLink) ? "YouTube link" : "video name";
      showToast(`⚠️ Duplicate! A video with the same ${reason} already exists: "${dupEntry.videoName}"`, "error"); return;
    }
    setSubmitting(true);
    const payload = { ...formData, priority: Number(formData.priority) };
    try {
      const res = editingId
        ? await fetch(`/api/videos/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/videos",               { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) { showToast(editingId ? "Video updated!" : "Video added!"); resetForm(); fetchVideos(); }
      else showToast("Save failed", "error");
    } catch { showToast("Network error", "error"); }
    finally  { setSubmitting(false); }
  }

  function handleEdit(item) {
    setEditingId(item._id);
    const domain = topicDomainMap[item.topic] || "";
    setFormDomain(domain);
    // Sync priority from priorities map (live), fall back to stored value
    const livePriority = topicPriorityMap[item.topic] ?? item.priority;
    setFormData({ priority: livePriority, topic: item.topic, videoName: item.videoName, channelName: item.channelName, youtubeLink: item.youtubeLink, series: item.series, downloaded: item.downloaded });
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this video?")) return;
    try {
      const res = await fetch(`/api/videos/${id}`, { method: "DELETE" });
      if (res.ok) { showToast("Video deleted"); fetchVideos(); }
    } catch { showToast("Delete failed", "error"); }
  }

  function resetForm() { setEditingId(null); setFormData(emptyForm); setFormDomain(""); setFormOpen(false); }

  async function toggleDownloaded(item) {
    try {
      await fetch(`/api/videos/${item._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...item, downloaded: !item.downloaded }) });
      fetchVideos();
    } catch { showToast("Update failed", "error"); }
  }

  function handleSort(field) {
    setSortConfig((prev) => prev.field === field ? { field, dir: prev.dir === "asc" ? "desc" : "asc" } : { field, dir: "asc" });
    setCurrentPage(1);
  }

  // When domain filter changes, clear topic filter if it doesn't belong to new domain
  function handleDomainFilterChange(e) {
    const domain = e.target.value;
    setSelectedDomain(domain);
    if (domain && selectedTopic) {
      const domainTopics = priorities.filter((p) => p.domain === domain).map((p) => p.topic);
      if (!domainTopics.includes(selectedTopic)) setSelectedTopic("");
    }
  }

  // ─── Filter + Sort ────────────────────────────────────────────────────────
  const filteredSorted = useMemo(() => {
    let list = videos.filter((item) => {
      const domain = topicDomainMap[item.topic] || "";
      const q = search.toLowerCase();
      const matchSearch  = !q || item.topic?.toLowerCase().includes(q) || item.videoName?.toLowerCase().includes(q) || item.channelName?.toLowerCase().includes(q) || item.series?.toLowerCase().includes(q) || domain.toLowerCase().includes(q);
      const matchTopic   = !selectedTopic  || item.topic  === selectedTopic;
      const matchDomain  = !selectedDomain || domain      === selectedDomain;
      const matchSeries  = !selectedSeries || item.series === selectedSeries;
      const matchDl      = downloadFilter === "all" ? true : downloadFilter === "downloaded" ? item.downloaded : !item.downloaded;
      return matchSearch && matchTopic && matchDomain && matchSeries && matchDl;
    });
    list = [...list].sort((a, b) => {
      let av, bv;
      if (sortConfig.field === "domain")    { av = topicDomainMap[a.topic] || "";    bv = topicDomainMap[b.topic] || ""; }
      else if (sortConfig.field === "priority") { av = topicPriorityMap[a.topic] ?? a.priority ?? 0; bv = topicPriorityMap[b.topic] ?? b.priority ?? 0; }
      else                                  { av = a[sortConfig.field] ?? "";         bv = b[sortConfig.field] ?? ""; }
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av < bv) return sortConfig.dir === "asc" ? -1 : 1;
      if (av > bv) return sortConfig.dir === "asc" ?  1 : -1;
      return 0;
    });
    return list;
  }, [videos, search, selectedTopic, selectedDomain, selectedSeries, downloadFilter, sortConfig, topicDomainMap, topicPriorityMap]);

  const totalPages      = Math.max(1, Math.ceil(filteredSorted.length / itemsPerPage));
  const safePage        = Math.min(currentPage, totalPages);
  const paginatedVideos = filteredSorted.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);
  const pageNumbers     = getPaginationRange(safePage, totalPages);
  useEffect(() => { setCurrentPage(1); }, [search, selectedTopic, selectedDomain, selectedSeries, downloadFilter, sortConfig]);

  // ─── Excel Import/Export ──────────────────────────────────────────────────
  async function handleExcelImport(event) {
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const workbook  = XLSX.read(e.target.result, { type: "binary" });
      const json      = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
      const formatted = json.map((item) => ({
        priority: Number(item.Priority || 0), topic: item.Topic || "", videoName: item["Video Name"] || "",
        channelName: item["Channel Name"] || "", youtubeLink: item["YouTube Link"] || "",
        series: item.Series || "", downloaded: item.Downloaded === "Yes" || item.Downloaded === true,
      })).filter((item) => item.videoName && item.youtubeLink);
      const existingUrls  = new Set(videos.map((v) => normalizeYtUrl(v.youtubeLink)));
      const existingNames = new Set(videos.map((v) => v.videoName.trim().toLowerCase()));
      const skipped = [], toInsert = [];
      for (const item of formatted) {
        const normUrl = normalizeYtUrl(item.youtubeLink), normName = item.videoName.trim().toLowerCase();
        if (existingUrls.has(normUrl))       skipped.push(`"${item.videoName}" (duplicate YouTube link)`);
        else if (existingNames.has(normName)) skipped.push(`"${item.videoName}" (duplicate video name)`);
        else { toInsert.push(item); existingUrls.add(normUrl); existingNames.add(normName); }
      }
      if (!toInsert.length) { showToast(`⚠️ All ${formatted.length} rows skipped — duplicates found.`, "error"); return; }
      try {
        for (const item of toInsert) await fetch("/api/videos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) });
        showToast(skipped.length ? `Imported ${toInsert.length} videos. Skipped ${skipped.length} duplicate(s).` : `Imported ${toInsert.length} videos successfully.`, skipped.length ? "warn" : "success");
        fetchVideos();
      } catch { showToast("Import failed", "error"); }
    };
    reader.readAsBinaryString(file); event.target.value = "";
  }

  function exportToExcel() {
    const data = filteredSorted.map((item) => ({
      Domain: topicDomainMap[item.topic] || "", Priority: item.priority, Topic: item.topic,
      "Video Name": item.videoName, "Channel Name": item.channelName, "YouTube Link": item.youtubeLink,
      Series: item.series, Downloaded: item.downloaded ? "Yes" : "No",
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Videos");
    saveAs(new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], { type: "application/octet-stream" }), "videos.xlsx");
  }

  function getYtId(url) {
    try { const u = new URL(url); return u.searchParams.get("v") || u.pathname.split("/").pop() || null; }
    catch { return url.split("v=")[1]?.split("&")[0] || null; }
  }

  const totalVideos     = videos.length;
  const downloadedCount = videos.filter((v) => v.downloaded).length;
  const pendingCount    = totalVideos - downloadedCount;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium max-w-sm transition-all ${toast.type === "error" ? "bg-red-600" : toast.type === "warn" ? "bg-yellow-500" : "bg-green-600"}`}>
          {toast.msg}
        </div>
      )}
      <div className="p-6 max-w-screen-xl mx-auto">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Videos</h1>
            <p className="text-sm text-gray-500 mt-1">{totalVideos} total · {downloadedCount} downloaded · {pendingCount} pending</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { setFormOpen((o) => !o); if (formOpen) resetForm(); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              {formOpen ? "✕ Close Form" : "+ Add Video"}
            </button>
            <label className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors">
              ↑ Import Excel<input type="file" accept=".xlsx,.xls" hidden onChange={handleExcelImport} />
            </label>
            <button onClick={exportToExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              ↓ Export ({filteredSorted.length})
            </button>
          </div>
        </div>

        {/* ── Form ── */}
        {formOpen && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
              {editingId ? "✏️ Edit Video" : "➕ Add New Video"}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

              {/* ── Domain (searchable, filters topics) ── */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Domain</label>
                <ComboBox
                  name="formDomain"
                  value={formDomain}
                  onChange={handleFormDomainChange}
                  options={uniqueDomains}
                  placeholder="Select domain first…"
                  className={inputCls}
                />
                {formDomain && !uniqueDomains.find((d) => d.toLowerCase() === formDomain.toLowerCase()) && (
                  <p className="text-xs text-blue-500 mt-0.5">✦ New domain</p>
                )}
              </div>

              {/* ── Topic (filtered by domain) ── */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Topic *</label>
                <ComboBox
                  name="topic"
                  value={formData.topic}
                  onChange={handleChange}
                  options={formTopicOptions}
                  placeholder={formDomain ? "Search topics…" : "Select domain first…"}
                  required
                  className={inputCls}
                />
                {formDomain && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formTopicOptions.length > 0 ? `${formTopicOptions.length} topics in "${formDomain}"` : "No topics in this domain"}
                  </p>
                )}
              </div>

              {/* ── Priority (auto-filled from priorities, editable) ── */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Priority <span className="ml-1 text-gray-400 normal-case font-normal">(auto-filled)</span>
                </label>
                <input
                  type="number"
                  name="priority"
                  placeholder="Auto-filled from topic"
                  value={formData.priority}
                  onChange={handleChange}
                  className={`border dark:border-gray-700 p-2.5 rounded-lg text-sm w-full ${
                    topicPriorityMap[formData.topic] != null
                      ? "bg-green-50 dark:bg-green-900/20 text-gray-900 dark:text-white border-green-300 dark:border-green-700"
                      : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  }`}
                />
                {formData.topic && topicPriorityMap[formData.topic] != null && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">✓ Synced from priorities</p>
                )}
              </div>

              {/* ── Video Name ── */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Video Name *</label>
                <input type="text" name="videoName" placeholder="Video name" value={formData.videoName} onChange={handleChange} required className="border dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 rounded-lg text-sm text-gray-900 dark:text-white" />
              </div>

              {/* ── Channel Name ── */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Channel Name</label>
                <ComboBox name="channelName" value={formData.channelName} onChange={handleChange} options={uniqueChannels} placeholder="Search or type channel…" className={inputCls} />
              </div>

              {/* ── Series ── */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Series</label>
                <ComboBox name="series" value={formData.series} onChange={handleChange} options={uniqueSeries} placeholder="Search or type series…" className={inputCls} />
              </div>

              {/* ── YouTube Link ── */}
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">YouTube Link *</label>
                <input type="url" name="youtubeLink" placeholder="https://youtube.com/watch?v=..." value={formData.youtubeLink} onChange={handleChange} required className="border dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 rounded-lg text-sm text-gray-900 dark:text-white" />
              </div>

              {/* ── Downloaded ── */}
              <div className="flex items-center gap-3 pt-4">
                <input type="checkbox" id="downloaded" name="downloaded" checked={formData.downloaded} onChange={handleChange} className="w-4 h-4 accent-blue-600" />
                <label htmlFor="downloaded" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">Downloaded</label>
              </div>

              {/* ── Actions ── */}
              <div className="flex gap-3 sm:col-span-2 items-end">
                <button type="submit" disabled={submitting} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 px-4 rounded-lg text-sm font-medium transition-colors">
                  {submitting ? "Saving…" : editingId ? "Update Video" : "Add Video"}
                </button>
                <button type="button" onClick={resetForm} className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white py-2.5 px-4 rounded-lg text-sm font-medium transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Filters ── */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 mb-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative sm:col-span-2 lg:col-span-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input type="text" placeholder="Search domain, topic, video…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400" />
            </div>
            {/* Domain filter — with search (ComboBox) */}
            <div>
              <ComboBox
                name="filterDomain"
                value={selectedDomain}
                onChange={(e) => handleDomainFilterChange(e)}
                options={uniqueDomains}
                placeholder="All Domains"
                className="border dark:border-gray-700 bg-white dark:bg-gray-800 p-2 pr-8 rounded-lg text-sm text-gray-900 dark:text-white w-full"
              />
            </div>
            {/* Topic filter — filtered by selected domain */}
            <select value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)} className="border dark:border-gray-700 bg-white dark:bg-gray-800 p-2 rounded-lg text-sm text-gray-900 dark:text-white">
              <option value="">All Topics</option>
              {filterTopicOptions.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            {/* Series filter */}
            <select value={selectedSeries} onChange={(e) => setSelectedSeries(e.target.value)} className="border dark:border-gray-700 bg-white dark:bg-gray-800 p-2 rounded-lg text-sm text-gray-900 dark:text-white">
              <option value="">All Series</option>
              {uniqueSeries.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            {/* Download status */}
            <select value={downloadFilter} onChange={(e) => setDownloadFilter(e.target.value)} className="border dark:border-gray-700 bg-white dark:bg-gray-800 p-2 rounded-lg text-sm text-gray-900 dark:text-white">
              <option value="all">All Status</option>
              <option value="downloaded">✅ Downloaded</option>
              <option value="not-downloaded">❌ Not Downloaded</option>
            </select>
          </div>

          {/* Active filter chips */}
          {(search || selectedDomain || selectedTopic || selectedSeries || downloadFilter !== "all") && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t dark:border-gray-800">
              {search && <span className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs px-2 py-1 rounded-full">Search: {search}<button onClick={() => setSearch("")} className="ml-1 hover:text-red-500">✕</button></span>}
              {selectedDomain && <span className="inline-flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 text-xs px-2 py-1 rounded-full">Domain: {selectedDomain}<button onClick={() => { setSelectedDomain(""); setSelectedTopic(""); }} className="ml-1 hover:text-red-500">✕</button></span>}
              {selectedTopic && <span className="inline-flex items-center gap-1 bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 text-xs px-2 py-1 rounded-full">Topic: {selectedTopic}<button onClick={() => setSelectedTopic("")} className="ml-1 hover:text-red-500">✕</button></span>}
              {selectedSeries && <span className="inline-flex items-center gap-1 bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 text-xs px-2 py-1 rounded-full">Series: {selectedSeries}<button onClick={() => setSelectedSeries("")} className="ml-1 hover:text-red-500">✕</button></span>}
              {downloadFilter !== "all" && <span className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 text-xs px-2 py-1 rounded-full">{downloadFilter === "downloaded" ? "Downloaded" : "Not Downloaded"}<button onClick={() => setDownloadFilter("all")} className="ml-1 hover:text-red-500">✕</button></span>}
              <button onClick={() => { setSearch(""); setSelectedDomain(""); setSelectedTopic(""); setSelectedSeries(""); setDownloadFilter("all"); }} className="text-xs text-gray-500 hover:text-red-500 underline">Clear all</button>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2">Showing {filteredSorted.length} of {totalVideos} videos</p>
        </div>

        {/* ── Table ── */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400"><span className="animate-spin mr-2">⟳</span> Loading videos…</div>
          ) : paginatedVideos.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              <div className="text-4xl mb-3">🎬</div>
              <p className="text-sm">No videos found. Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-left">
                    <th className="px-4 py-3 font-semibold w-28">Thumbnail</th>
                    <th className="px-4 py-3 font-semibold cursor-pointer hover:text-blue-600 select-none whitespace-nowrap" onClick={() => handleSort("priority")}>Priority <SortIcon field="priority" sortConfig={sortConfig} /></th>
                    <th className="px-4 py-3 font-semibold cursor-pointer hover:text-blue-600 select-none whitespace-nowrap" onClick={() => handleSort("domain")}>Domain <SortIcon field="domain" sortConfig={sortConfig} /></th>
                    <th className="px-4 py-3 font-semibold cursor-pointer hover:text-blue-600 select-none whitespace-nowrap" onClick={() => handleSort("topic")}>Topic <SortIcon field="topic" sortConfig={sortConfig} /></th>
                    <th className="px-4 py-3 font-semibold cursor-pointer hover:text-blue-600 select-none whitespace-nowrap" onClick={() => handleSort("videoName")}>Video Name <SortIcon field="videoName" sortConfig={sortConfig} /></th>
                    <th className="px-4 py-3 font-semibold cursor-pointer hover:text-blue-600 select-none whitespace-nowrap" onClick={() => handleSort("channelName")}>Channel <SortIcon field="channelName" sortConfig={sortConfig} /></th>
                    <th className="px-4 py-3 font-semibold cursor-pointer hover:text-blue-600 select-none whitespace-nowrap" onClick={() => handleSort("series")}>Series <SortIcon field="series" sortConfig={sortConfig} /></th>
                    <th className="px-4 py-3 font-semibold text-center whitespace-nowrap">Downloaded</th>
                    <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {paginatedVideos.map((item) => {
                    const ytId      = getYtId(item.youtubeLink);
                    const thumbnail = ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null;
                    const domain    = topicDomainMap[item.topic] || "—";
                    // Show live priority from priorities map if available
                    const livePriority = topicPriorityMap[item.topic] ?? item.priority;
                    return (
                      <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-3">
                          {thumbnail ? (
                            <img src={thumbnail} alt={item.videoName} className="w-24 h-14 object-cover rounded-md bg-gray-200" onError={(e) => { e.target.style.display = "none"; }} />
                          ) : (
                            <div className="w-24 h-14 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center text-gray-400 text-xs">No img</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs font-bold px-2 py-0.5 rounded">{livePriority}</span>
                        </td>
                        <td className="px-4 py-3">
                          {domain !== "—" ? (
                            <span className="inline-block bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 text-xs font-medium px-2 py-0.5 rounded">{domain}</span>
                          ) : <span className="text-gray-400 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 text-xs px-2 py-0.5 rounded">{item.topic}</span>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <a href={item.youtubeLink} target="_blank" rel="noopener noreferrer" className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 font-medium line-clamp-2" title={item.videoName}>{item.videoName}</a>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs whitespace-nowrap">{item.channelName || "—"}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">{item.series || "—"}</td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => toggleDownloaded(item)} className={`text-xs px-2 py-1 rounded font-medium transition-colors ${item.downloaded ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 hover:bg-green-200" : "bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200"}`}>
                            {item.downloaded ? "✅" : "⬜"}
                          </button>
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

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
            <p className="text-xs text-gray-500">Page {safePage} of {totalPages} ({filteredSorted.length} results)</p>
            <div className="flex flex-wrap gap-1">
              <button onClick={() => setCurrentPage(1)} disabled={safePage === 1} className="px-2 py-1.5 rounded text-xs bg-gray-200 dark:bg-gray-800 disabled:opacity-40 hover:bg-gray-300 dark:hover:bg-gray-700">«</button>
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={safePage === 1} className="px-2 py-1.5 rounded text-xs bg-gray-200 dark:bg-gray-800 disabled:opacity-40 hover:bg-gray-300 dark:hover:bg-gray-700">‹</button>
              {pageNumbers[0] > 1 && <span className="px-2 py-1.5 text-xs text-gray-400">…</span>}
              {pageNumbers.map((p) => (
                <button key={p} onClick={() => setCurrentPage(p)} className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${p === safePage ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"}`}>{p}</button>
              ))}
              {pageNumbers[pageNumbers.length - 1] < totalPages && <span className="px-2 py-1.5 text-xs text-gray-400">…</span>}
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="px-2 py-1.5 rounded text-xs bg-gray-200 dark:bg-gray-800 disabled:opacity-40 hover:bg-gray-300 dark:hover:bg-gray-700">›</button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={safePage === totalPages} className="px-2 py-1.5 rounded text-xs bg-gray-200 dark:bg-gray-800 disabled:opacity-40 hover:bg-gray-300 dark:hover:bg-gray-700">»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}