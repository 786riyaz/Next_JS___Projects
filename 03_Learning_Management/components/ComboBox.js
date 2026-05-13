"use client";
import { useState, useRef, useEffect } from "react";
/**
* ComboBox — searchable input with dropdown suggestions.
*
* Fires onChange with a synthetic event { target: { name, value } }
* so it works as a drop-in replacement for <input> / <select> onChange handlers.
*
* Props:
*   name        – field name (passed back in synthetic event)
*   value       – controlled value (string)
*   onChange    – (syntheticEvent) => void
*   options     – string[]  existing values to suggest
*   placeholder – string
*   required    – bool
*   disabled    – bool
*   className   – extra classes for the <input>
*/
export default function ComboBox({
name,
value = "",
onChange,
options = [],
placeholder = "",
required = false,
disabled = false,
className = "",
}) {
const [open, setOpen] = useState(false);
const containerRef = useRef(null);
// Close dropdown on outside click
useEffect(() => {
function onClickOutside(e) {
if (containerRef.current && !containerRef.current.contains(e.target)) {
setOpen(false);
}
}
document.addEventListener("mousedown", onClickOutside);
return () => document.removeEventListener("mousedown", onClickOutside);
}, []);
// Filtered options: show all when empty, otherwise filter by input
const filtered = value
? options.filter((opt) => opt.toLowerCase().includes(value.toLowerCase()))
: options;
// Show "Add new" hint when typed value doesn't exactly match any existing option
const isNew =
value.trim() !== "" &&
!options.find((o) => o.toLowerCase() === value.trim().toLowerCase());
function fire(val) {
onChange({ target: { name, value: val } });
}
function handleInputChange(e) {
fire(e.target.value);
setOpen(true);
}
function handleSelect(opt) {
fire(opt);
setOpen(false);
}
const showDropdown = open && !disabled && (filtered.length > 0 || isNew);
return (
<div ref={containerRef} className="relative">
<input
type="text"
name={name}
value={value}
onChange={handleInputChange}
onFocus={() => setOpen(true)}
placeholder={placeholder}
required={required}
disabled={disabled}
autoComplete="off"
spellCheck={false}
className={className}
/>
{/* Chevron icon */}
{!disabled && (
<button
type="button"
tabIndex={-1}
onMouseDown={(e) => {
e.preventDefault();
setOpen((o) => !o);
}}
className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs select-none"
>
{open ? "▲" : "▼"}
</button>
)}
{showDropdown && (
<ul className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-2xl max-h-52 overflow-y-auto">
{filtered.map((opt) => (
<li
key={opt}
onMouseDown={(e) => {
e.preventDefault();
handleSelect(opt);
}}
className={`px-3 py-2 text-sm cursor-pointer transition-colors
hover:bg-blue-50 dark:hover:bg-blue-900/30
text-gray-900 dark:text-white
${opt.toLowerCase() === value.toLowerCase()
? "bg-blue-50 dark:bg-blue-900/20 font-semibold text-blue-700 dark:text-blue-300"
: ""
}`}
>
{opt}
</li>
))}
{/* "Add new" row when typed value is not in options */}
{isNew && (
<li
onMouseDown={(e) => {
e.preventDefault();
handleSelect(value.trim());
}}
className="px-3 py-2 text-sm cursor-pointer text-blue-600 dark:text-blue-400
hover:bg-blue-50 dark:hover:bg-blue-900/30
border-t border-gray-100 dark:border-gray-700 font-medium flex items-center gap-1"
>
<span className="text-base leading-none">＋</span>
<span>Add &ldquo;{value.trim()}&rdquo;</span>
</li>
)}
</ul>
)}
</div>
);
}