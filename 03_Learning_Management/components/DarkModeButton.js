"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
export default function DarkModeButton() {
const { theme, setTheme, resolvedTheme } = useTheme();
const [mounted, setMounted] = useState(false);
// Avoid hydration mismatch — only render after mount
useEffect(() => { setMounted(true); }, []);
if (!mounted) return null;
const isDark = resolvedTheme === "dark";
return (
<button
onClick={() => setTheme(isDark ? "light" : "dark")}
className="w-full bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-lg transition-all text-sm font-medium"
>
{isDark ? "☀️  Light Mode" : "🌙  Dark Mode"}
</button>
);
}