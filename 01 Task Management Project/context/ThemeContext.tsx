"use client";

import { createContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

export const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
}>({
  theme: "light",
  toggleTheme: () => {},
});

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<Theme>("light");

  // Load initial theme
  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme;
    const initial = saved || "light";
    setTheme(initial);
  }, []);

  // Apply theme explicitly
  useEffect(() => {
    const html = document.documentElement;

    // ALWAYS remove first
    html.classList.remove("dark");

    if (theme === "dark") {
      html.classList.add("dark");
    }

    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) =>
      prev === "dark" ? "light" : "dark"
    );
  };

  return (
    <ThemeContext.Provider
      value={{ theme, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}