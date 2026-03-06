// app/chat/page.tsx
"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";
import { getToken } from "@/lib/auth";
import { useSocket } from "@/hooks/useSocket";
import { jwtDecode } from "jwt-decode";

export default function ChatPage() {
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);

  const socket = useSocket();

  const token = getToken();
  const user: any = token ? jwtDecode(token) : null;
  const userId = user?.id;

  useEffect(() => {
    if (!token) return;

    fetch("/api/chats", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setChats(data);
      })
      .catch(() => setChats([]));
  }, [token]);

  const handleCreateChat = (newChat: any) => {
    setChats((prev) => {
      const exists = prev.find((c) => c.id === newChat.id);
      if (exists) return prev;

      return [newChat, ...prev];
    });

    setSelectedChat(newChat);
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar
        chats={chats}
        onSelect={setSelectedChat}
        onCreateChat={handleCreateChat}
      />

      <ChatWindow
        key={selectedChat?.id}
        chat={selectedChat}
        socket={socket}
        userId={userId}
      />
    </div>
  );
}
