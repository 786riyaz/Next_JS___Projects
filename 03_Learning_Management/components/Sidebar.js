// components/Sidebar.js
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export default function Sidebar() {
  const pathname = usePathname();
  const navItems = [
    { name: "Domain Priorities",    path: "/priorities" },
    { name: "YouTube Videos",       path: "/videos"     },
    { name: "Other Learning Links", path: "/links"      },
    { name: "Notes",                path: "/notes"      },
    { name: "Tasks",                path: "/tasks"      },
    { name: "⚙️ Settings",         path: "/settings"   },
  ];
  return (
    <aside className="w-64 min-h-screen bg-black text-white p-5 border-r border-gray-800 flex flex-col">
      <h1 className="text-2xl font-bold mb-10 leading-snug">Learning Manager</h1>
      <nav className="flex flex-col gap-3 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`p-3 rounded-lg transition-all ${
              pathname === item.path ? "bg-blue-600" : "hover:bg-gray-800"
            }`}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}