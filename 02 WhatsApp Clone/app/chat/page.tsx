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
  const [isMobile, setIsMobile] = useState(false);

  const socket = useSocket();

  const token = getToken();
  const user: any = token ? jwtDecode(token) : null;
  const userId = user?.id;

  /*
  MOBILE DETECTION
  */

  useEffect(() => {

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();

    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);

  }, []);

  /*
  LOAD CHATS
  */

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

  /*
  LIVE UPDATE
  */

  useEffect(() => {

    if (!socket) return;

    const handleUnreadUpdate = ({ chatId, senderId, message }: any) => {

      setChats((prev) =>
        prev
          .map((chat) => {

            if (chat.id !== chatId) return chat;

            const updatedMembers = chat.members.map((m: any) => {

              if (m.userId === userId && senderId !== userId) {
                return {
                  ...m,
                  unreadCount: (m.unreadCount || 0) + 1
                };
              }

              return m;

            });

            return {
              ...chat,
              members: updatedMembers,
              messages: [message]
            };

          })
          .sort((a, b) => {

            const timeA = new Date(a.messages?.[0]?.createdAt || 0).getTime();
            const timeB = new Date(b.messages?.[0]?.createdAt || 0).getTime();

            return timeB - timeA;

          })
      );

    };

    socket.on("chat-unread-update", handleUnreadUpdate);

    return () => socket.off("chat-unread-update", handleUnreadUpdate);

  }, [socket, userId]);

  /*
  CREATE CHAT
  */

  const handleCreateChat = (newChat: any) => {

    setChats((prev) => {

      const exists = prev.find((c) => c.id === newChat.id);
      if (exists) return prev;

      return [newChat, ...prev];

    });

    setSelectedChat(newChat);

  };

  /*
  UI
  */

  return (

    <div className="chat-layout">

      {/* SIDEBAR */}

      {(!isMobile || !selectedChat) && (

        <Sidebar
          chats={chats}
          setChats={setChats}
          onSelect={setSelectedChat}
          onCreateChat={handleCreateChat}
          socket={socket}
        />

      )}

      {/* CHAT WINDOW */}

      {(!isMobile || selectedChat) && (

        <ChatWindow
          key={selectedChat?.id}
          chat={selectedChat}
          socket={socket}
          userId={userId}
        />

      )}

    </div>

  );

}