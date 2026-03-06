// components/Sidebar.tsx
"use client";

import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";
import { jwtDecode } from "jwt-decode";

export default function Sidebar({
  chats = [],
  onSelect,
  onCreateChat
}: any) {

  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {

    const t = getToken();

    if (!t) return;

    setToken(t);

    const decoded: any = jwtDecode(t);
    setCurrentUser(decoded);

    setMounted(true);

  }, []);

  useEffect(() => {

    if (!token) return;

    fetch("/api/users", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setUsers(data);
        }
      });

  }, [token]);

  const createPersonalChat = async (targetUserId: string) => {

    if (!token) return;

    const res = await fetch("/api/chat/personal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ targetUserId })
    });

    const data = await res.json();

    if (!res.ok) {
      console.error(data);
      return;
    }

    onCreateChat(data);

  };

  if (!mounted) return null;

  return (
    <div
      style={{
        width: 320,
        background: "#111b21",
        borderRight: "1px solid #2a2f32",
        display: "flex",
        flexDirection: "column",
        height: "100vh"
      }}
    >

      {/* Logged user */}

      <div
        style={{
          padding: 16,
          borderBottom: "1px solid #2a2f32",
          fontWeight: "bold"
        }}
      >
        Logged in as
        <div style={{ color: "#25D366", marginTop: 4 }}>
          {currentUser?.name || currentUser?.mobile}
        </div>
      </div>

      {/* Chats */}

      <div style={{ flex: 1, overflowY: "auto" }}>

        {chats.map((chat: any) => {

          const otherUser = chat.members?.find(
            (m: any) => m.user.id !== currentUser?.id
          );

          const lastMessage = chat.messages?.[0];

          return (
            <div
              key={chat.id}
              onClick={() => onSelect(chat)}
              style={{
                padding: 14,
                borderBottom: "1px solid #2a2f32",
                cursor: "pointer"
              }}
            >

              <div style={{ fontWeight: "bold" }}>
                {chat.isGroup
                  ? chat.name
                  : otherUser?.user?.name ||
                    otherUser?.user?.mobile ||
                    "Chat"}
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: "#8696a0",
                  marginTop: 4
                }}
              >
                {lastMessage?.content || "No messages yet"}
              </div>

              {lastMessage && (
                <div
                  style={{
                    fontSize: 10,
                    color: "#8696a0",
                    marginTop: 3
                  }}
                >
                  {new Date(lastMessage.createdAt).toLocaleTimeString()}
                </div>
              )}

            </div>
          );
        })}

      </div>

      {/* Start new chat */}

      <div style={{ borderTop: "1px solid #2a2f32" }}>

        <div
          style={{
            padding: 12,
            fontWeight: "bold"
          }}
        >
          Start new chat
        </div>

        {users
          .filter((u) => u.id !== currentUser?.id)
          .map((u: any) => (
            <div
              key={u.id}
              onClick={() => createPersonalChat(u.id)}
              style={{
                padding: 12,
                cursor: "pointer",
                borderBottom: "1px solid #2a2f32",
                color: "#25D366"
              }}
            >
              {u.name || u.mobile}
            </div>
          ))}

      </div>

    </div>
  );
}