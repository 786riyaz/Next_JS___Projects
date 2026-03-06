// components/Sidebar.tsx
"use client";

import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";
import { jwtDecode } from "jwt-decode";

export default function Sidebar({
  chats,
  setChats,
  onSelect,
  onCreateChat,
  socket,
}: any) {
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = getToken();
    if (!t) return;

    setToken(t);

    const decoded: any = jwtDecode(t);
    setCurrentUser(decoded);
  }, []);

  /*
  SOCKET LIVE UPDATES
  */

  /*
SOCKET LIVE UPDATES
*/

  useEffect(() => {
    if (!socket) return;

    const handleUnread = ({ chatId, senderId, message }: any) => {
      if (senderId === currentUser?.id) return;

      setChats((prev: any[]) =>
        prev.map((chat) => {
          if (chat.id !== chatId) return chat;

          const updatedMembers = chat.members.map((m: any) => {
            if (m.userId === currentUser.id) {
              return {
                ...m,
                unreadCount: (m.unreadCount || 0) + 1,
              };
            }

            return m;
          });

          return {
            ...chat,
            members: updatedMembers,
            messages: [message],
          };
        }),
      );
    };

    socket.on("chat-unread-update", handleUnread);

    return () => socket.off("chat-unread-update", handleUnread);
  }, [socket, currentUser]);

  useEffect(() => {
    if (!token) return;

    fetch("/api/users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then(setUsers);
  }, [token]);

  const createPersonalChat = async (targetUserId: string) => {

  const res = await fetch("/api/chat/personal", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ targetUserId })
  })

  const data = await res.json()

  if (!res.ok) {
    console.error(data)
    return
  }

  onCreateChat(data)

}

  return (
    <div
      style={{
        width: 320,
        background: "#111b21",
        borderRight: "1px solid #2a2f32",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
      }}
    >
      {/* USER */}

      <div style={{ padding: 16 }}>
        Logged in as
        <div style={{ color: "#25D366" }}>
          {currentUser?.name || currentUser?.mobile}
        </div>
      </div>

      {/* CHAT LIST */}

      <div style={{ flex: 1, overflowY: "auto" }}>
        {chats.map((chat: any) => {
          const otherUser = chat.members?.find(
            (m: any) => m.user.id !== currentUser?.id,
          );

          const lastMessage = chat.messages?.[0];

          const membership = chat.members?.find(
            (m: any) => m.userId === currentUser?.id,
          );

          const unread = membership?.unreadCount || 0;

          return (
            <div
              key={chat.id}
              onClick={() => onSelect(chat)}
              style={{
                padding: 14,
                borderBottom: "1px solid #2a2f32",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontWeight: "bold" }}>
                  {chat.isGroup
                    ? chat.name
                    : otherUser?.user?.name || otherUser?.user?.mobile}
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: "#8696a0",
                  }}
                >
                  {lastMessage?.content || "No messages"}
                </div>
              </div>

              {unread > 0 && (
                <div
                  style={{
                    background: "#25D366",
                    borderRadius: 20,
                    padding: "2px 8px",
                    fontSize: 12,
                    fontWeight: "bold",
                  }}
                >
                  {unread}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ borderTop: "1px solid #2a2f32" }}>
        <div style={{ padding: 12, fontWeight: "bold" }}>Start new chat</div>

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
                color: "#25D366",
              }}
            >
              {u.name || u.mobile}
            </div>
          ))}
      </div>
    </div>
  );
}
