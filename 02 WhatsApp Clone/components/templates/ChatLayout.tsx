// components/templates/ChatLayout.tsx
"use client"

import Sidebar from "../organisms/Sidebar"
import ChatWindow from "../organisms/ChatWindow"

export default function ChatLayout() {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <ChatWindow />
    </div>
  )
}