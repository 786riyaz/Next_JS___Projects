"use client";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import ComboBox from "@/components/ComboBox";
import { DOMAIN_COLORS } from "@/lib/domainColors";
const DEFAULT_DOMAIN_ORDER = ["General","Web Dev","Deployment","AI/LLM","System Design","Other Programming","Personal","Hobbies","Other"];
const norm = (s) => s.toLowerCase().replace(/[\s/]/g, "");
function sortDomains(domains, domainOrder) {
const orderNorm = domainOrder.map(norm);
return [...domains].sort((a, b) => {
const ai = orderNorm.indexOf(norm(a)); const bi = orderNorm.indexOf(norm(b));
const ai2 = ai === -1 ? 999 : ai; const bi2 = bi === -1 ? 999 : bi;
if (ai2 !== bi2) return ai2 - bi2;
return a.localeCompare(b);
});
}
function buildColorMap(sortedDomains, overrides) {
const map = {};
sortedDomains.forEach((d, i) => {
const idx = (d in overrides) ? overrides[d] : i % DOMAIN_COLORS.length;
map[d] = DOMAIN_COLORS[idx];
});
return map;
}
function useAppSettings() {
const [settings, setSettings] = useState(null);
useEffect(() => {
fetch("/api/settings").then((r) => r.json()).then(setSettings).catch(() => setSettings({}));
}, []);
return settings;
}
function parseBool(val) {
if (typeof val === "boolean") return val;
if (typeof val === "string") return val.trim().toLowerCase() === "yes" || val.trim().toLowerCase() === "true";
return false;
}
function SortIcon({ field, sortConfig }) {
if (sortConfig.field !== field) return <span className="ml-1 text-gray-400">↕</span>;
return <span className="ml-1">{sortConfig.dir === "asc" ? "↑" : "↓"}</span>;
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
function TopicFilterDropdown({ grouped, value, onChange, allDomains, domainColorMap }) {
const [open, setOpen] = useState(false);
const [query, setQuery] = useState("");
const ref = useRef(null);
useEffect(() => {
function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
document.addEventListener("mousedown", handler);
return () => document.removeEventListener("mousedown", handler);
}, []);
const filtered = useMemo(() => {
if (!query.trim()) return grouped;
const q = query.toLowerCase();
return grouped
.map((g) => ({ ...g, topics: g.topics.filter((t) => t.toLowerCase().includes(q)) }))
.filter((g) => g.topics.length > 0 || g.domain.toLowerCase().includes(q));
}, [grouped, query]);
const selectedColor = value ? domainColorMap[grouped.find((g) => g.topics.includes(value))?.domain] : null;
function select(topic) { onChange(topic); setOpen(false); setQuery(""); }
return (
<div ref={ref} className="relative">
<button type="button" onClick={() => setOpen((o) => !o)}
className="w-full flex items-center justify-between border dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg text-sm text-left">
{value ? (
<span className={`inline-flex items-center gap-1.5 font-medium ${selectedColor?.text || "text-gray-900 dark:text-white"}`}>
<span className={`w-2 h-2 rounded-full ${selectedColor?.dot || "bg-gray-400"}`} />{value}
</span>
) : <span className="text-gray-500">All Topics</span>}
<span className="text-gray-400 text-xs ml-2">{open ? "▲" : "▼"}</span>
</button>
{open && (
<div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-2xl max-h-72 flex flex-col">
<div className="p-2 border-b dark:border-gray-700">
<input autoFocus type="text" placeholder="Search topics…" value={query} onChange={(e) => setQuery(e.target.value)}
className="w-full px-2 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded outline-none" />
</div>
<div className="overflow-y-auto flex-1">
{!query && (
<div onMouseDown={(e) => { e.preventDefault(); select(""); }}
className={`px-3 py-2 text-sm cursor-pointer text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 ${!value ? "font-semibold bg-gray-50 dark:bg-gray-700" : ""}`}>
All Topics
</div>
)}
{filtered.map((group) => {
const color = domainColorMap[group.domain] || DOMAIN_COLORS[0];
return (
<div key={group.domain}>
<div className={`px-3 py-1 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 sticky top-0 ${color.bg} ${color.text}`}>
<span className={`w-2 h-2 rounded-full ${color.dot}`} />{group.domain}
</div>
{group.topics.map((topic) => (
<div key={topic} onMouseDown={(e) => { e.preventDefault(); select(topic); }}
className={`px-4 py-2 text-sm cursor-pointer transition-colors ${topic === value ? `${color.bg} ${color.text} font-semibold` : "text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
{topic}
</div>
))}
</div>
);
})}
{filtered.length === 0 && <div className="px-3 py-4 text-sm text-gray-400 text-center">No topics found</div>}
</div>
</div>
)}
</div>
);
}
export default function VideosPage() {
const appSettings = useAppSettings();
const domainOrder = appSettings?.domainOrder ?? DEFAULT_DOMAIN_ORDER;
const colorOverrides = appSettings?.domainColorOverrides ?? {};
const settingsDefaultDomain = appSettings?.defaultDomain ?? "Web Dev";
const [videos, setVideos] = useState([]);
const [priorities, setPriorities] = useState([]);
const [editingId, setEditingId] = useState(null);
const [loading, setLoading] = useState(true);
const [submitting, setSubmitting] = useState(false);
const [toast, setToast] = useState(null);
const [search, setSearch] = useState("");
const [selectedDomain, setSelectedDomain] = useState(null); // null = waiting for settings
const [selectedTopic, setSelectedTopic] = useState("");
const [seriesFilter, setSeriesFilter] = useState(false);
const [notSeriesFilter, setNotSeriesFilter] = useState(false);
const [downloadedFilter, setDownloadedFilter] = useState(false);
const [notDownloadedFilter, setNotDownloadedFilter] = useState(false);
const [sortConfig, setSortConfig] = useState({ field: "priority", dir: "asc" });
const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 10;
const emptyForm = { domain: "", priority: "", topic: "", videoName: "", channelName: "", youtubeLink: "", series: false, downloaded: false };
const [formData, setFormData] = useState(emptyForm);
const [formOpen, setFormOpen] = useState(false);
const [ytFetching, setYtFetching] = useState(false);
const ytDebounceRef = useRef(null);
const [importModal, setImportModal] = useState(false);
const [importDefaultTopic, setImportDefaultTopic] = useState("");
const [importDefaultDomain, setImportDefaultDomain] = useState("");
const importFileRef = useRef(null);
const showToast = useCallback((msg, type = "success") => {
setToast({ msg, type });
setTimeout(() => setToast(null), 4000);
}, []);
const topicPriorityMap = useMemo(() => {
const map = {};
priorities.forEach((p) => { if (p.topic && p.domain) map[`${p.domain}::${p.topic}`] = p.learnPriority; });
return map;
}, [priorities]);
async function fetchVideos() {
setLoading(true);
try { const res = await fetch("/api/videos"); setVideos(await res.json()); }
catch { showToast("Failed to load videos", "error"); }
finally { setLoading(false); }
}
async function fetchPriorities() {
try { const res = await fetch("/api/priorities"); const data = await res.json(); setPriorities(data); return data; }
catch { showToast("Failed to load priorities", "error"); }
}
useEffect(() => {
fetchVideos();
fetchPriorities(); /* eslint-disable-next-line */
}, []);
const uniqueDomains = useMemo(() => {
const fromPriorities = priorities.map((p) => p.domain);
const fromVideos = videos.map((v) => v.domain);
return sortDomains([...new Set([...fromPriorities, ...fromVideos].filter(Boolean))], domainOrder);
}, [priorities, videos, domainOrder]);
const domainColorMap = useMemo(() => buildColorMap(uniqueDomains, colorOverrides), [uniqueDomains, colorOverrides]);
// Once settings load, apply default domain
useEffect(() => {
if (appSettings !== null && selectedDomain === null) {
setSelectedDomain(settingsDefaultDomain ?? "");
}
}, [appSettings]); // eslint-disable-line
// Validate default domain against actual data once both loaded
useEffect(() => {
if (selectedDomain && (priorities.length > 0 || videos.length > 0)) {
const allDomains = [...new Set([...priorities.map(p=>p.domain), ...videos.map(v=>v.domain)].filter(Boolean))];
const exact = allDomains.find((d) => d === selectedDomain);
if (!exact) {
const loose = allDomains.find((d) => norm(d) === norm(selectedDomain));
if (loose) setSelectedDomain(loose);
else setSelectedDomain("");
}
}
}, [priorities, videos, appSettings]); // eslint-disable-line
const formTopicOptions = useMemo(() => {
if (!formData.domain) return [...new Set(priorities.map((p) => p.topic).filter(Boolean))].sort();
return [...new Set(priorities.filter((p) => p.domain === formData.domain).map((p) => p.topic).filter(Boolean))].sort();
}, [priorities, formData.domain]);
const filterTopicGrouped = useMemo(() => {
const domainMap = {};
priorities.forEach((p) => {
if (!p.topic || !p.domain) return;
if (selectedDomain && p.domain !== selectedDomain) return;
if (!domainMap[p.domain]) domainMap[p.domain] = new Set();
domainMap[p.domain].add(p.topic);
});
return sortDomains(Object.keys(domainMap), domainOrder)
.map((domain) => ({ domain, topics: [...domainMap[domain]].sort() }));
}, [priorities, selectedDomain, domainOrder]);
const uniqueChannels = useMemo(() => [...new Set(videos.map((v) => v.channelName).filter(Boolean))].sort(), [videos]);
function normalizeYtUrl(url) {
try {
const u = new URL(url);
// Handle shorts: /shorts/<id>
if (u.pathname.startsWith("/shorts/")) {
return u.pathname.split("/shorts/")[1].split("/")[0];
}
const v = u.searchParams.get("v");
return v ? v : url.trim().toLowerCase();
} catch { return url.trim().toLowerCase(); }
}
function isDuplicateVideo(youtubeLink, videoName, channelName, excludeId = null) {
const normUrl = normalizeYtUrl(youtubeLink);
const normName = videoName.trim().toLowerCase();
const normChannel = (channelName || "").trim().toLowerCase();
return videos.find((v) => {
if (v._id === excludeId) return false;
if (normalizeYtUrl(v.youtubeLink) === normUrl) return true;
const vChannel = (v.channelName || "").trim().toLowerCase();
if (v.videoName.trim().toLowerCase() === normName && vChannel === normChannel && normChannel !== "") return true;
return false;
});
}
// FIX 1: Added youtube.com/shorts support
function isValidYoutubeUrl(url) {
return url && (
url.includes("youtube.com/watch") ||
url.includes("youtu.be/") ||
url.includes("youtube.com/shorts/")
);
}
async function fetchYoutubeMeta(url) {
if (!isValidYoutubeUrl(url)) return;
setYtFetching(true);
try {
const res = await fetch(`/api/youtube-meta?url=${encodeURIComponent(url)}`);
const data = await res.json();
if (data.title) { setFormData((prev) => ({ ...prev, videoName: prev.videoName || data.title, channelName: prev.channelName || data.channel })); showToast("✓ Video info auto-filled from YouTube"); }
} catch { /* silent */ } finally { setYtFetching(false); }
}
function handleFormDomainChange(e) {
const domain = e.target.value;
setFormData((prev) => {
const topicsInNewDomain = priorities.filter((p) => p.domain === domain).map((p) => p.topic);
const keepTopic = topicsInNewDomain.includes(prev.topic);
return { ...prev, domain, ...(keepTopic ? {} : { topic: "", priority: "" }) };
});
}
function handleChange(e) {
const { name, value, checked, type } = e.target;
if (name === "topic") {
setFormData((prev) => {
const key = prev.domain ? `${prev.domain}::${value}` : "";
const priority = key ? (topicPriorityMap[key] ?? "") : "";
return { ...prev, topic: value, priority };
});
return;
}
if (name === "youtubeLink") {
setFormData((prev) => ({ ...prev, youtubeLink: value }));
if (ytDebounceRef.current) clearTimeout(ytDebounceRef.current);
ytDebounceRef.current = setTimeout(() => fetchYoutubeMeta(value), 800);
return;
}
setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
}
async function handleSubmit(e) {
e.preventDefault();
if (!formData.topic || !formData.videoName || !formData.youtubeLink) { showToast("Please fill Topic, Video Name and YouTube Link", "error"); return; }
const dupEntry = isDuplicateVideo(formData.youtubeLink, formData.videoName, formData.channelName, editingId);
if (dupEntry) {
const normUrl = normalizeYtUrl(dupEntry.youtubeLink) === normalizeYtUrl(formData.youtubeLink);
const reason = normUrl ? "YouTube link" : `video name in channel "${dupEntry.channelName || "unknown"}"`;
showToast(`⚠️ Duplicate! A video with the same ${reason} already exists: "${dupEntry.videoName}"`, "error"); return;
}
setSubmitting(true);
const payload = { ...formData, domain: formData.domain || "", priority: Number(formData.priority), series: Boolean(formData.series), downloaded: Boolean(formData.downloaded) };
try {
const topicExists = priorities.some((p) => p.domain.trim().toLowerCase() === (formData.domain || "").trim().toLowerCase() && p.topic.trim().toLowerCase() === formData.topic.trim().toLowerCase());
if (!topicExists && formData.domain && formData.topic) {
// FIX 2: Use actual values from the form fields instead of hardcoded 0
const newLearnPriority = Number(formData.priority) || 0;
const newModuleOrder = Number(formData.priority) || 0;
// FIX 3: Check if learnPriority is already taken before creating new topic
if (newLearnPriority !== 0) {
const priorityTaken = priorities.some((p) => Number(p.learnPriority) === newLearnPriority);
if (priorityTaken) {
const takenBy = priorities.find((p) => Number(p.learnPriority) === newLearnPriority);
showToast(`⚠️ Learn Priority "${newLearnPriority}" is already taken by topic "${takenBy.topic}" in "${takenBy.domain}". Please use a different priority.`, "error");
setSubmitting(false); return;
}
}
await fetch("/api/priorities", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ domain: formData.domain, topic: formData.topic, moduleOrder: newModuleOrder, learnPriority: newLearnPriority }) });
await fetchPriorities();
}
const res = editingId
? await fetch(`/api/videos/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
: await fetch("/api/videos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
if (res.ok) { showToast(editingId ? "Video updated!" : "Video added!"); resetForm(); fetchVideos(); }
else showToast("Save failed", "error");
} catch { showToast("Network error", "error"); }
finally { setSubmitting(false); }
}
function handleEdit(item) {
setEditingId(item._id);
const domain = item.domain || "";
const key = `${domain}::${item.topic}`;
const livePriority = topicPriorityMap[key] ?? item.priority;
setFormData({ domain, priority: livePriority, topic: item.topic, videoName: item.videoName, channelName: item.channelName, youtubeLink: item.youtubeLink, series: parseBool(item.series), downloaded: parseBool(item.downloaded) });
setFormOpen(true);
window.scrollTo({ top: 0, behavior: "smooth" });
}
async function handleDelete(id) {
if (!window.confirm("Delete this video?")) return;
try { const res = await fetch(`/api/videos/${id}`, { method: "DELETE" }); if (res.ok) { showToast("Video deleted"); fetchVideos(); } }
catch { showToast("Delete failed", "error"); }
}
function resetForm() { setEditingId(null); setFormData(emptyForm); setFormOpen(false); }
async function toggleDownloaded(item) {
try {
await fetch(`/api/videos/${item._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ domain: item.domain || "", priority: item.priority, topic: item.topic, videoName: item.videoName, channelName: item.channelName, youtubeLink: item.youtubeLink, series: parseBool(item.series), downloaded: !parseBool(item.downloaded) }) });
fetchVideos();
} catch { showToast("Update failed", "error"); }
}
function handleSort(field) { setSortConfig((prev) => (prev.field === field ? { field, dir: prev.dir === "asc" ? "desc" : "asc" } : { field, dir: "asc" })); setCurrentPage(1); }
function handleDomainFilterChange(domain) {
setSelectedDomain(domain);
if (domain && selectedTopic) {
const domainTopics = priorities.filter((p) => p.domain === domain).map((p) => p.topic);
if (!domainTopics.includes(selectedTopic)) setSelectedTopic("");
}
}
const filteredSorted = useMemo(() => {
let list = videos.filter((item) => {
const domain = item.domain || "";
const q = search.toLowerCase();
const matchSearch = !q || item.topic?.toLowerCase().includes(q) || item.videoName?.toLowerCase().includes(q) || item.channelName?.toLowerCase().includes(q) || domain.toLowerCase().includes(q);
const matchTopic = !selectedTopic || item.topic === selectedTopic;
const matchDomain = !selectedDomain || selectedDomain === null || domain === selectedDomain;
const isSeries = parseBool(item.series);
const isDownloaded = parseBool(item.downloaded);
let matchSeries = true;
if (seriesFilter && !notSeriesFilter) matchSeries = isSeries === true;
else if (!seriesFilter && notSeriesFilter) matchSeries = isSeries !== true;
let matchDl = true;
if (downloadedFilter && !notDownloadedFilter) matchDl = isDownloaded === true;
else if (!downloadedFilter && notDownloadedFilter) matchDl = isDownloaded !== true;
return matchSearch && matchTopic && matchDomain && matchSeries && matchDl;
});
list = [...list].sort((a, b) => {
let av, bv;
if (sortConfig.field === "domain") { av = a.domain || ""; bv = b.domain || ""; }
else if (sortConfig.field === "priority") { av = a.priority ?? 0; bv = b.priority ?? 0; }
else if (sortConfig.field === "series") { av = parseBool(a.series) ? 1 : 0; bv = parseBool(b.series) ? 1 : 0; }
else if (sortConfig.field === "downloaded") { av = parseBool(a.downloaded) ? 1 : 0; bv = parseBool(b.downloaded) ? 1 : 0; }
else { av = a[sortConfig.field] ?? ""; bv = b[sortConfig.field] ?? ""; }
if (typeof av === "string") av = av.toLowerCase();
if (typeof bv === "string") bv = bv.toLowerCase();
if (av < bv) return sortConfig.dir === "asc" ? -1 : 1;
if (av > bv) return sortConfig.dir === "asc" ? 1 : -1;
return 0;
});
return list;
}, [videos, search, selectedTopic, selectedDomain, seriesFilter, notSeriesFilter, downloadedFilter, notDownloadedFilter, sortConfig]);
const totalPages = Math.max(1, Math.ceil(filteredSorted.length / itemsPerPage));
const safePage = Math.min(currentPage, totalPages);
const paginatedVideos = filteredSorted.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);
const pageNumbers = getPaginationRange(safePage, totalPages);
useEffect(() => { setCurrentPage(1); }, [search, selectedTopic, selectedDomain, seriesFilter, notSeriesFilter, downloadedFilter, notDownloadedFilter, sortConfig]);
async function handleExcelImport(event) {
const file = event.target.files[0]; if (!file) return;
const reader = new FileReader();
reader.onload = async (e) => {
const workbook = XLSX.read(e.target.result, { type: "binary" });
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const defaultTopic = importDefaultTopic.trim();
const defaultDomain = importDefaultDomain.trim();
const defaultKey = defaultDomain && defaultTopic ? `${defaultDomain}::${defaultTopic}` : "";
const defaultPriority = defaultKey ? (topicPriorityMap[defaultKey] ?? 0) : 0;
const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
const firstRow = (rawRows[0] || []).map((c) => String(c || "").trim());
const hasHeader = firstRow.some((c) => /youtube link|videoname|topic|channel|priority/i.test(c));
let formatted;
if (hasHeader) {
const json = XLSX.utils.sheet_to_json(sheet);
formatted = json.map((item) => {
const topic = (item.Topic || "").trim() || defaultTopic;
const domain = (item.Domain || "").trim() || defaultDomain;
const key = domain && topic ? `${domain}::${topic}` : "";
const priority = key ? (topicPriorityMap[key] ?? Number(item.Priority || defaultPriority)) : Number(item.Priority || 0);
return { priority, topic, domain, videoName: (item["Video Name"] || "").trim(), channelName: (item["Channel Name"] || "").trim(), youtubeLink: (item["YouTube Link"] || String(Object.values(item)[0] || "")).trim(), series: parseBool(item.Series), downloaded: parseBool(item.Downloaded) };
});
} else {
formatted = rawRows.flatMap((row) => row.map((cell) => String(cell || "").trim()))
.filter((cell) => cell.includes("youtube.com") || cell.includes("youtu.be"))
.map((url) => ({ priority: defaultPriority, topic: defaultTopic, domain: defaultDomain, videoName: "", channelName: "", youtubeLink: url, series: false, downloaded: false }));
}
const validFormatted = formatted.filter((item) => item.youtubeLink);
const existingUrls = new Set(videos.map((v) => normalizeYtUrl(v.youtubeLink)));
const existingChannelNames = new Set(videos.map((v) => `${(v.channelName || "").trim().toLowerCase()}::${v.videoName.trim().toLowerCase()}`));
const skipped = [], toInsert = [];
for (const item of validFormatted) {
const normUrl = normalizeYtUrl(item.youtubeLink);
const channelKey = `${(item.channelName || "").trim().toLowerCase()}::${(item.videoName || "").trim().toLowerCase()}`;
if (existingUrls.has(normUrl)) { skipped.push(`"${item.videoName || item.youtubeLink}" (duplicate YouTube link)`); continue; }
if (item.videoName && existingChannelNames.has(channelKey)) { skipped.push(`"${item.videoName}" (duplicate name in same channel)`); continue; }
toInsert.push(item); existingUrls.add(normUrl);
if (item.videoName) existingChannelNames.add(channelKey);
}
if (!toInsert.length) { showToast(`⚠️ All ${validFormatted.length} rows are duplicates — nothing imported.`, "warn"); return; }
for (let i = 0; i < toInsert.length; i++) {
const item = toInsert[i];
if (item.videoName && item.channelName) continue;
setToast({ msg: `⟳ Fetching YouTube info… ${i + 1}/${toInsert.length}`, type: "warn" });
try { const res = await fetch(`/api/youtube-meta?url=${encodeURIComponent(item.youtubeLink)}`); const data = await res.json(); if (data.title) item.videoName = item.videoName || data.title; if (data.channel) item.channelName = item.channelName || data.channel; }
catch { /* save with blank fields */ }
}
let saved = 0, fetchFailed = 0, missingTopic = 0, saveFailed = 0;
for (const item of toInsert) {
if (!item.videoName) { fetchFailed++; continue; }
if (!item.topic) { missingTopic++; continue; }
try { const res = await fetch("/api/videos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) }); if (res.ok) { saved++; } else { saveFailed++; } }
catch { saveFailed++; }
}
const parts = ["Imported " + saved + " video(s)."];
if (skipped.length) parts.push(skipped.length + " duplicate(s) skipped.");
if (missingTopic > 0) parts.push(missingTopic + " skipped (Topic column blank).");
if (fetchFailed > 0) parts.push(fetchFailed + " skipped (YouTube title not found).");
if (saveFailed > 0) parts.push(saveFailed + " failed to save.");
showToast(parts.join(" "), saved === 0 ? "error" : skipped.length || missingTopic || fetchFailed || saveFailed ? "warn" : "success");
fetchVideos();
};
reader.readAsBinaryString(file); event.target.value = "";
}
function exportToExcel() {
const data = filteredSorted.map((item) => ({ Domain: item.domain || "", Priority: item.priority, Topic: item.topic, "Video Name": item.videoName, "Channel Name": item.channelName, "YouTube Link": item.youtubeLink, Series: parseBool(item.series) ? "Yes" : "No", Downloaded: parseBool(item.downloaded) ? "Yes" : "No" }));
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Videos");
saveAs(new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], { type: "application/octet-stream" }), "videos.xlsx");
}
// FIX 1: getYtId also extracts ID from shorts URLs
function getYtId(url) {
try {
const u = new URL(url);
if (u.pathname.startsWith("/shorts/")) return u.pathname.split("/shorts/")[1].split("/")[0];
return u.searchParams.get("v") || u.pathname.split("/").pop() || null;
} catch { return url.split("v=")[1]?.split("&")[0] || null; }
}
const totalVideos = videos.length;
const downloadedCount = videos.filter((v) => parseBool(v.downloaded)).length;
const pendingCount = totalVideos - downloadedCount;
const hasActiveFilter = search || (selectedDomain && selectedDomain !== null) || selectedTopic || seriesFilter || notSeriesFilter || downloadedFilter || notDownloadedFilter;
return (
<div className="min-h-screen bg-gray-50 dark:bg-gray-950">
{toast && (
<div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium max-w-sm transition-all ${toast.type === "error" ? "bg-red-600" : toast.type === "warn" ? "bg-yellow-500" : "bg-green-600"}`}>
{toast.msg}
</div>
)}
<div className="p-6 max-w-screen-xl mx-auto">
{/* Header */}
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
<div>
<h1 className="text-3xl font-bold text-gray-900 dark:text-white">🎬 YouTube Videos</h1>
<p className="text-sm text-gray-500 mt-1">{totalVideos} total · {downloadedCount} downloaded · {pendingCount} pending</p>
</div>
<div className="flex flex-wrap gap-2">
<button onClick={() => { setFormOpen((o) => !o); if (formOpen) resetForm(); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
{formOpen ? "✕ Close Form" : "+ Add Video"}
</button>
<button onClick={() => setImportModal(true)} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">↑ Import Excel</button>
<input ref={importFileRef} type="file" accept=".xlsx,.xls" hidden onChange={handleExcelImport} />
<button onClick={exportToExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">↓ Export ({filteredSorted.length})</button>
</div>
</div>
{/* Import Modal */}
{importModal && (
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setImportModal(false)}>
<div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
<h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">↑ Import Excel</h2>
<p className="text-xs text-gray-500 dark:text-gray-400 mb-4">If your Excel rows have blank <strong>Domain</strong> or <strong>Topic</strong> columns, set defaults below.</p>
<div className="flex flex-col gap-3">
<div className="flex flex-col gap-1">
<label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Default Domain (for blank rows)</label>
<ComboBox name="importDomain" value={importDefaultDomain} onChange={(e) => { setImportDefaultDomain(e.target.value); setImportDefaultTopic(""); }} options={uniqueDomains} placeholder="Select or type domain…" className="border dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 pr-8 rounded-lg text-sm text-gray-900 dark:text-white w-full" />
</div>
<div className="flex flex-col gap-1">
<label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Default Topic (for blank rows)</label>
<ComboBox name="importTopic" value={importDefaultTopic} onChange={(e) => setImportDefaultTopic(e.target.value)}
options={importDefaultDomain ? priorities.filter((p) => p.domain === importDefaultDomain).map((p) => p.topic).filter(Boolean) : priorities.map((p) => p.topic).filter(Boolean)}
placeholder="Select or type topic…" className="border dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 pr-8 rounded-lg text-sm text-gray-900 dark:text-white w-full" />
{importDefaultTopic && <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">✓ Will be applied to all rows with blank Topic</p>}
</div>
</div>
<div className="flex gap-3 mt-5">
<button onClick={() => { setImportModal(false); importFileRef.current?.click(); }} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 px-4 rounded-lg text-sm font-medium">Choose File & Import</button>
<button onClick={() => setImportModal(false)} className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white py-2.5 px-4 rounded-lg text-sm font-medium">Cancel</button>
</div>
</div>
</div>
)}
{/* Form */}
{formOpen && (
<div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-6 shadow-sm">
<h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">{editingId ? "✏️ Edit Video" : "➕ Add New Video"}</h2>
<form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
<div className="flex flex-col gap-1">
<label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Domain</label>
<ComboBox name="formDomain" value={formData.domain} onChange={handleFormDomainChange} options={uniqueDomains} placeholder="Select or type domain…" className={inputCls} />
{formData.domain && !uniqueDomains.find((d) => d.toLowerCase() === formData.domain.toLowerCase()) && (
<p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">✦ New domain will be created</p>
)}
</div>
<div className="flex flex-col gap-1">
<label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Topic *</label>
<ComboBox name="topic" value={formData.topic} onChange={handleChange} options={formTopicOptions} placeholder={formData.domain ? "Search topics…" : "Select domain first…"} required className={inputCls} />
{formData.domain && <p className="text-xs text-gray-400 mt-0.5">{formTopicOptions.length > 0 ? `${formTopicOptions.length} topics in "${formData.domain}"` : "No topics in this domain"}</p>}
</div>
<div className="flex flex-col gap-1">
<label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
Priority
{formData.priority !== "" && topicPriorityMap[`${formData.domain}::${formData.topic}`] !== undefined
? <span className="ml-1 text-gray-400 normal-case font-normal">(auto-filled)</span>
: formData.topic && !priorities.some((p) => p.domain.trim().toLowerCase() === (formData.domain||"").trim().toLowerCase() && p.topic.trim().toLowerCase() === formData.topic.trim().toLowerCase())
? <span className="ml-1 text-blue-400 normal-case font-normal">(set for new topic)</span>
: null}
</label>
<input type="number" name="priority" placeholder="Auto-filled from topic" value={formData.priority} onChange={handleChange}
className={`border dark:border-gray-700 p-2.5 rounded-lg text-sm w-full ${formData.priority !== "" ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700" : "bg-white dark:bg-gray-800"} text-gray-900 dark:text-white`} />
{formData.topic && formData.priority !== "" && topicPriorityMap[`${formData.domain}::${formData.topic}`] !== undefined && <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">✓ Synced from priorities</p>}
{formData.topic && !priorities.some((p) => p.domain.trim().toLowerCase() === (formData.domain||"").trim().toLowerCase() && p.topic.trim().toLowerCase() === formData.topic.trim().toLowerCase()) && (
<p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">✦ New topic — enter priority manually</p>
)}
</div>
<div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-3">
<label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
YouTube Link *{ytFetching && <span className="ml-2 text-blue-500 normal-case font-normal animate-pulse">⟳ Fetching info…</span>}
</label>
<input type="url" name="youtubeLink" placeholder="Paste YouTube link — video name & channel will auto-fill" value={formData.youtubeLink} onChange={handleChange} required className="border dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 rounded-lg text-sm text-gray-900 dark:text-white" />
{!ytFetching && isValidYoutubeUrl(formData.youtubeLink) && <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">✓ Valid YouTube URL detected</p>}
</div>
<div className="flex flex-col gap-1">
<label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Video Name *{formData.videoName && isValidYoutubeUrl(formData.youtubeLink) && <span className="ml-1 text-gray-400 normal-case font-normal">(auto-filled)</span>}</label>
<input type="text" name="videoName" placeholder="Auto-filled from YouTube link" value={formData.videoName} onChange={handleChange} required
className={`border dark:border-gray-700 p-2.5 rounded-lg text-sm w-full ${formData.videoName && isValidYoutubeUrl(formData.youtubeLink) ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700" : "bg-white dark:bg-gray-800"} text-gray-900 dark:text-white`} />
</div>
<div className="flex flex-col gap-1">
<label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Channel Name{formData.channelName && isValidYoutubeUrl(formData.youtubeLink) && <span className="ml-1 text-gray-400 normal-case font-normal">(auto-filled)</span>}</label>
<ComboBox name="channelName" value={formData.channelName} onChange={handleChange} options={uniqueChannels} placeholder="Auto-filled from YouTube link"
className={`${inputCls} ${formData.channelName && isValidYoutubeUrl(formData.youtubeLink) ? "!bg-green-50 dark:!bg-green-900/20 !border-green-300 dark:!border-green-700" : ""}`} />
</div>
<div className="flex items-center gap-6 pt-4">
<label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="series" name="series" checked={!!formData.series} onChange={handleChange} className="w-4 h-4 accent-blue-600" /><span className="text-sm text-gray-700 dark:text-gray-300">Is Series</span></label>
<label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="downloaded" name="downloaded" checked={!!formData.downloaded} onChange={handleChange} className="w-4 h-4 accent-blue-600" /><span className="text-sm text-gray-700 dark:text-gray-300">Downloaded</span></label>
</div>
<div className="flex gap-3 sm:col-span-2 items-end">
<button type="submit" disabled={submitting} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 px-4 rounded-lg text-sm font-medium">{submitting ? "Saving…" : editingId ? "Update Video" : "Add Video"}</button>
<button type="button" onClick={resetForm} className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white py-2.5 px-4 rounded-lg text-sm font-medium">Cancel</button>
</div>
</form>
</div>
)}
{/* Filters */}
<div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 mb-4 shadow-sm">
<div className="flex flex-col gap-3">
<div className="relative">
<span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
<input type="text" placeholder="Search domain, topic, video…" value={search} onChange={(e) => setSearch(e.target.value)}
className="w-full pl-9 pr-3 py-2 border dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none" />
</div>
{/* Domain Buttons with colors */}
<div className="flex flex-wrap items-center gap-2">
<button onClick={() => handleDomainFilterChange("")}
className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${!selectedDomain ? "bg-gray-700 text-white border-gray-700" : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
All Domains
</button>
{uniqueDomains.map((d) => {
const color = domainColorMap[d] || DOMAIN_COLORS[0];
const isSelected = selectedDomain === d;
return (
<button key={d} onClick={() => handleDomainFilterChange(selectedDomain === d ? "" : d)}
className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${isSelected ? `${color.bg} ${color.text} border-transparent font-bold` : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
<span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />{d}
</button>
);
})}
</div>
<div className="flex flex-wrap items-center gap-4">
<div className="min-w-48">
<TopicFilterDropdown grouped={filterTopicGrouped} value={selectedTopic} onChange={setSelectedTopic} allDomains={uniqueDomains} domainColorMap={domainColorMap} />
</div>
<label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300 select-none">
<input type="checkbox" checked={seriesFilter} onChange={(e) => { setSeriesFilter(e.target.checked); if (e.target.checked) setNotSeriesFilter(false); }} className="w-4 h-4 accent-indigo-600" />Series
</label>
<label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300 select-none">
<input type="checkbox" checked={notSeriesFilter} onChange={(e) => { setNotSeriesFilter(e.target.checked); if (e.target.checked) setSeriesFilter(false); }} className="w-4 h-4 accent-orange-500" />Not Series
</label>
<label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300 select-none">
<input type="checkbox" checked={downloadedFilter} onChange={(e) => { setDownloadedFilter(e.target.checked); if (e.target.checked) setNotDownloadedFilter(false); }} className="w-4 h-4 accent-green-600" />Downloaded
</label>
<label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300 select-none">
<input type="checkbox" checked={notDownloadedFilter} onChange={(e) => { setNotDownloadedFilter(e.target.checked); if (e.target.checked) setDownloadedFilter(false); }} className="w-4 h-4 accent-red-500" />Not Downloaded
</label>
</div>
</div>
{hasActiveFilter && (
<div className="flex flex-wrap gap-2 mt-3 pt-3 border-t dark:border-gray-800">
{search && <span className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs px-2 py-1 rounded-full">Search: {search}<button onClick={() => setSearch("")} className="ml-1 hover:text-red-500">✕</button></span>}
{selectedDomain && <span className="inline-flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 text-xs px-2 py-1 rounded-full">Domain: {selectedDomain}<button onClick={() => { setSelectedDomain(""); setSelectedTopic(""); }} className="ml-1 hover:text-red-500">✕</button></span>}
{selectedTopic && <span className="inline-flex items-center gap-1 bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 text-xs px-2 py-1 rounded-full">Topic: {selectedTopic}<button onClick={() => setSelectedTopic("")} className="ml-1 hover:text-red-500">✕</button></span>}
{seriesFilter && <span className="inline-flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 text-xs px-2 py-1 rounded-full">Series<button onClick={() => setSeriesFilter(false)} className="ml-1 hover:text-red-500">✕</button></span>}
{notSeriesFilter && <span className="inline-flex items-center gap-1 bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 text-xs px-2 py-1 rounded-full">Not Series<button onClick={() => setNotSeriesFilter(false)} className="ml-1 hover:text-red-500">✕</button></span>}
{downloadedFilter && <span className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 text-xs px-2 py-1 rounded-full">Downloaded<button onClick={() => setDownloadedFilter(false)} className="ml-1 hover:text-red-500">✕</button></span>}
{notDownloadedFilter && <span className="inline-flex items-center gap-1 bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 text-xs px-2 py-1 rounded-full">Not Downloaded<button onClick={() => setNotDownloadedFilter(false)} className="ml-1 hover:text-red-500">✕</button></span>}
<button onClick={() => { setSearch(""); setSelectedDomain(""); setSelectedTopic(""); setSeriesFilter(false); setNotSeriesFilter(false); setDownloadedFilter(false); setNotDownloadedFilter(false); }} className="text-xs text-gray-500 hover:text-red-500 underline">Clear all</button>
</div>
)}
<p className="text-xs text-gray-400 mt-2">Showing {filteredSorted.length} of {totalVideos} videos</p>
</div>
{/* Table */}
<div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
{loading ? (
<div className="flex items-center justify-center py-20 text-gray-400"><span className="animate-spin mr-2">⟳</span> Loading videos…</div>
) : paginatedVideos.length === 0 ? (
<div className="py-20 text-center text-gray-400"><div className="text-4xl mb-3">🎬</div><p className="text-sm">No videos found. Try adjusting your filters.</p></div>
) : (
<div className="overflow-x-auto">
<table className="w-full text-sm min-w-[1100px]">
<thead>
<tr className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-left">
<th className="px-4 py-3 font-semibold w-28">Thumbnail</th>
<th className="px-4 py-3 font-semibold cursor-pointer hover:text-blue-600 select-none whitespace-nowrap" onClick={() => handleSort("priority")}>Priority <SortIcon field="priority" sortConfig={sortConfig} /></th>
<th className="px-4 py-3 font-semibold cursor-pointer hover:text-blue-600 select-none whitespace-nowrap" onClick={() => handleSort("domain")}>Domain <SortIcon field="domain" sortConfig={sortConfig} /></th>
<th className="px-4 py-3 font-semibold cursor-pointer hover:text-blue-600 select-none whitespace-nowrap" onClick={() => handleSort("topic")}>Topic <SortIcon field="topic" sortConfig={sortConfig} /></th>
<th className="px-4 py-3 font-semibold cursor-pointer hover:text-blue-600 select-none whitespace-nowrap w-80" onClick={() => handleSort("videoName")}>Video Name <SortIcon field="videoName" sortConfig={sortConfig} /></th>
<th className="px-4 py-3 font-semibold cursor-pointer hover:text-blue-600 select-none whitespace-nowrap" onClick={() => handleSort("channelName")}>Channel <SortIcon field="channelName" sortConfig={sortConfig} /></th>
<th className="px-4 py-3 font-semibold cursor-pointer hover:text-blue-600 select-none text-center whitespace-nowrap" onClick={() => handleSort("series")}>Series <SortIcon field="series" sortConfig={sortConfig} /></th>
<th className="px-4 py-3 font-semibold cursor-pointer hover:text-blue-600 select-none text-center whitespace-nowrap" onClick={() => handleSort("downloaded")}>Downloaded <SortIcon field="downloaded" sortConfig={sortConfig} /></th>
<th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Actions</th>
</tr>
</thead>
<tbody className="divide-y divide-gray-100 dark:divide-gray-800">
{paginatedVideos.map((item) => {
const ytId = getYtId(item.youtubeLink);
const thumbnail = ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null;
const domain = item.domain || "—";
const domainColor = domain !== "—" ? (domainColorMap[item.domain] || DOMAIN_COLORS[0]) : null;
const key = `${item.domain}::${item.topic}`;
const livePriority = topicPriorityMap[key] ?? item.priority;
const isSeries = parseBool(item.series);
const isDownloaded = parseBool(item.downloaded);
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
{domainColor ? (
<span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded ${domainColor.bg} ${domainColor.text}`}>
<span className={`w-1.5 h-1.5 rounded-full ${domainColor.dot}`} />{domain}
</span>
) : <span className="text-gray-400 text-xs">—</span>}
</td>
<td className="px-4 py-3">
<span className="inline-block bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 text-xs px-2 py-0.5 rounded">{item.topic}</span>
</td>
<td className="px-4 py-3 w-80">
<a href={item.youtubeLink} target="_blank" rel="noopener noreferrer" className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 font-medium line-clamp-2" title={item.videoName}>{item.videoName}</a>
</td>
<td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs whitespace-nowrap">{item.channelName || "—"}</td>
<td className="px-4 py-3 text-center text-xs">{isSeries ? "✅" : "—"}</td>
<td className="px-4 py-3 text-center">
<button onClick={() => toggleDownloaded(item)}
className={`text-xs px-2 py-1 rounded font-medium transition-colors ${isDownloaded ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 hover:bg-green-200" : "bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200"}`}>
{isDownloaded ? "✅" : "⬜"}
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