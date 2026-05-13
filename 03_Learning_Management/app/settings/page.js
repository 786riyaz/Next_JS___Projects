// app/settings/page.js
"use client";
import { useEffect, useState, useCallback } from "react";
import { DOMAIN_COLORS } from "@/lib/domainColors";

const DEFAULT_DOMAIN_ORDER = [
  "General", "Web Dev", "Deployment", "AI/LLM",
  "System Design", "Other Programming", "Personal", "Hobbies", "Other",
];

const COLOR_NAMES = [
  "Indigo", "Emerald", "Orange", "Pink", "Violet",
  "Cyan", "Amber", "Teal", "Rose", "Sky", "Lime", "Fuchsia",
];

export default function SettingsPage() {
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  // ── Loaded from DB ───────────────────────────────────────────────────────
  const [domainOrder, setDomainOrder] = useState(DEFAULT_DOMAIN_ORDER);
  const [defaultDomain, setDefaultDomain] = useState("Web Dev");
  const [domainColorOverrides, setDomainColorOverrides] = useState({}); // { "Web Dev": 2 }

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.domainOrder)          setDomainOrder(data.domainOrder);
        if (data.defaultDomain)        setDefaultDomain(data.defaultDomain);
        if (data.domainColorOverrides) setDomainColorOverrides(data.domainColorOverrides);
      })
      .catch(() => {});
  }, []);

  async function saveSetting(key, value) {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    if (!res.ok) throw new Error("Save failed");
  }

  async function handleSaveAll() {
    setSaving(true);
    try {
      await Promise.all([
        saveSetting("domainOrder",          domainOrder),
        saveSetting("defaultDomain",        defaultDomain),
        saveSetting("domainColorOverrides", domainColorOverrides),
      ]);
      showToast("Settings saved! Reload other pages to see changes.");
    } catch { showToast("Save failed", "error"); }
    finally { setSaving(false); }
  }

  // ── Domain Order reorder ─────────────────────────────────────────────────
  function moveDomain(idx, dir) {
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= domainOrder.length) return;
    const next = [...domainOrder];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    setDomainOrder(next);
  }

  function addDomain() {
    const name = prompt("Enter new domain name:");
    if (!name?.trim()) return;
    if (domainOrder.find((d) => d.toLowerCase() === name.trim().toLowerCase())) {
      showToast("Domain already exists", "error"); return;
    }
    setDomainOrder((prev) => [...prev, name.trim()]);
  }

  function removeDomain(idx) {
    if (!window.confirm(`Remove "${domainOrder[idx]}" from the order list?\n(This won't delete existing data.)`)) return;
    const next = [...domainOrder];
    next.splice(idx, 1);
    setDomainOrder(next);
    // also clean up color override
    const d = domainOrder[idx];
    setDomainColorOverrides((prev) => {
      const copy = { ...prev };
      delete copy[d];
      return copy;
    });
  }

  function renameDomain(idx) {
    const oldName = domainOrder[idx];
    const newName = prompt("Rename domain:", oldName);
    if (!newName?.trim() || newName.trim() === oldName) return;
    if (domainOrder.find((d, i) => i !== idx && d.toLowerCase() === newName.trim().toLowerCase())) {
      showToast("Name already exists", "error"); return;
    }
    const next = [...domainOrder];
    next[idx] = newName.trim();
    setDomainOrder(next);
    // migrate color override key
    setDomainColorOverrides((prev) => {
      if (!(oldName in prev)) return prev;
      const copy = { ...prev };
      copy[newName.trim()] = copy[oldName];
      delete copy[oldName];
      return copy;
    });
  }

  function resetOrder() {
    if (!window.confirm("Reset domain order to default?")) return;
    setDomainOrder(DEFAULT_DOMAIN_ORDER);
  }

  // ── Color helpers ─────────────────────────────────────────────────────────
  function getColorIndex(domain, position) {
    if (domain in domainColorOverrides) return domainColorOverrides[domain];
    return position % DOMAIN_COLORS.length;
  }

  function setColorOverride(domain, colorIdx) {
    setDomainColorOverrides((prev) => ({ ...prev, [domain]: colorIdx }));
  }

  function resetColors() {
    if (!window.confirm("Reset all color assignments to default?")) return;
    setDomainColorOverrides({});
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium max-w-sm ${toast.type === "error" ? "bg-red-600" : "bg-green-600"}`}>
          {toast.msg}
        </div>
      )}
      <div className="p-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">⚙️ Settings</h1>
            <p className="text-sm text-gray-500 mt-1">Configure domain order, colors, and defaults</p>
          </div>
          <button onClick={handleSaveAll} disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
            {saving ? "Saving…" : "💾 Save All Settings"}
          </button>
        </div>

        {/* ── Default Domain ─────────────────────────────────────────────── */}
        <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-1">🏠 Default Domain</h2>
          <p className="text-xs text-gray-500 mb-4">Pre-selected domain filter on the Videos and Priorities pages when you open them.</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setDefaultDomain("")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${defaultDomain === "" ? "bg-gray-700 text-white border-gray-700" : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
              None
            </button>
            {domainOrder.map((d, i) => {
              const colorIdx = getColorIndex(d, i);
              const color = DOMAIN_COLORS[colorIdx];
              const isSelected = defaultDomain === d;
              return (
                <button key={d} onClick={() => setDefaultDomain(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${isSelected ? `${color.bg} ${color.text} border-transparent font-bold` : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />{d}
                </button>
              );
            })}
          </div>
          {defaultDomain && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-3">✓ Default set to: <strong>{defaultDomain}</strong></p>
          )}
        </section>

        {/* ── Domain Order ───────────────────────────────────────────────── */}
        <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-semibold text-gray-800 dark:text-white">📋 Domain Order</h2>
            <div className="flex gap-2">
              <button onClick={addDomain} className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded transition-colors">+ Add</button>
              <button onClick={resetOrder} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-xs px-3 py-1.5 rounded transition-colors">Reset</button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-4">Controls the order domain filter buttons appear on all pages.</p>
          <div className="flex flex-col gap-2">
            {domainOrder.map((d, i) => {
              const colorIdx = getColorIndex(d, i);
              const color = DOMAIN_COLORS[colorIdx];
              return (
                <div key={d} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
                  <span className="text-xs text-gray-400 w-5 text-right">{i + 1}</span>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded flex-1 ${color.bg} ${color.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />{d}
                  </span>
                  <div className="flex gap-1 items-center">
                    <button onClick={() => moveDomain(i, "up")} disabled={i === 0}
                      className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-30 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded">▲</button>
                    <button onClick={() => moveDomain(i, "down")} disabled={i === domainOrder.length - 1}
                      className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-30 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded">▼</button>
                    <button onClick={() => renameDomain(i)}
                      className="bg-blue-100 dark:bg-blue-900/40 hover:bg-blue-200 text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded">✏️</button>
                    <button onClick={() => removeDomain(i)}
                      className="bg-red-100 dark:bg-red-900/40 hover:bg-red-200 text-red-600 dark:text-red-400 text-xs px-2 py-1 rounded">✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Domain Colors ──────────────────────────────────────────────── */}
        <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-semibold text-gray-800 dark:text-white">🎨 Domain Colors</h2>
            <button onClick={resetColors} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-xs px-3 py-1.5 rounded transition-colors">Reset All</button>
          </div>
          <p className="text-xs text-gray-500 mb-4">Assign a color to each domain. By default colors cycle in order.</p>
          <div className="flex flex-col gap-3">
            {domainOrder.map((d, i) => {
              const currentIdx = getColorIndex(d, i);
              const isOverridden = d in domainColorOverrides;
              return (
                <div key={d} className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 dark:text-gray-300 w-36 truncate font-medium">{d}</span>
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {DOMAIN_COLORS.map((c, ci) => (
                      <button key={ci} onClick={() => setColorOverride(d, ci)}
                        title={COLOR_NAMES[ci]}
                        className={`w-6 h-6 rounded-full ${c.dot} transition-all ${currentIdx === ci ? "ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-900 scale-125" : "opacity-70 hover:opacity-100 hover:scale-110"}`} />
                    ))}
                  </div>
                  {isOverridden && (
                    <button onClick={() => { const copy = { ...domainColorOverrides }; delete copy[d]; setDomainColorOverrides(copy); }}
                      className="text-xs text-gray-400 hover:text-red-500 whitespace-nowrap">↺ reset</button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Color Palette Preview ──────────────────────────────────────── */}
        <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-4">👁️ Color Palette Reference</h2>
          <div className="flex flex-wrap gap-2">
            {DOMAIN_COLORS.map((c, i) => (
              <span key={i} className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full ${c.bg} ${c.text}`}>
                <span className={`w-2 h-2 rounded-full ${c.dot}`} />{COLOR_NAMES[i]}
              </span>
            ))}
          </div>
        </section>

        <div className="mt-6 flex justify-end">
          <button onClick={handleSaveAll} disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-8 py-2.5 rounded-lg text-sm font-medium transition-colors">
            {saving ? "Saving…" : "💾 Save All Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}