import "./globals.css";
import type { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";

export const metadata = {
  title: "Learning Manager",
  description: "Learning Videos Manager",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-gray-950 text-white">
        <div className="flex">
          <Sidebar />
          <main className="flex-1 min-h-screen p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}