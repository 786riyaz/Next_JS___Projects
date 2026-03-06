// components/ChatWindow.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";

export default function ChatWindow({ chat, socket, userId }: any) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);

  const otherUser = chat?.members?.find((m: any) => m.user.id !== userId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!chat || !socket) return;

    setMessages(() => []);

    socket.emit("join-chat", chat.id);

    fetch(`/api/messages/${chat.id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setMessages(data);
        }
      });

    const handleMessage = (message: any) => {
      if (!chat || message.chatId !== chat.id) {
        return;
      }

      setMessages((prev) => {
        const exists = prev.some((m) => m.id === message.id);
        if (exists) return prev;

        return [...prev, message];
      });
    };

    socket.on("receive-message", handleMessage);

    return () => {
      socket.off("receive-message", handleMessage);
    };
  }, [chat?.id, socket]);

  const sendMessage = () => {
    if (!input.trim() || !socket || !chat) return;

    socket.emit("send-message", {
      content: input,
      chatId: chat.id,
      userId,
    });

    setInput("");
  };

  if (!chat) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b141a",
          color: "#8696a0",
        }}
      >
        Select a chat to start messaging
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: "#0b141a",
      }}
    >
      <div
        style={{
          padding: 15,
          borderBottom: "1px solid #2a2f32",
          background: "#202c33",
          fontWeight: "bold",
        }}
      >
        {chat.isGroup
          ? chat.name
          : otherUser?.user?.name || otherUser?.user?.mobile || "Chat"}
      </div>

      <div
        style={{
          flex: 1,
          padding: 20,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} own={m.userId === userId} />
        ))}

        <div ref={bottomRef} />
      </div>

      <div
        style={{
          display: "flex",
          padding: 10,
          background: "#111b21",
          borderTop: "1px solid #2a2f32",
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message"
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 6,
            border: "none",
            background: "#202c33",
            color: "white",
          }}
        />

        <button
          onClick={sendMessage}
          style={{
            marginLeft: 10,
            padding: "10px 16px",
            background: "#25D366",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
