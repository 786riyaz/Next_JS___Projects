// components/ChatWindow.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";

export default function ChatWindow({ chat, socket, userId }: any) {

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [typingUser, setTypingUser] = useState(false);
  const [uploading, setUploading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const readMessagesRef = useRef<Set<string>>(new Set());

  const otherUser = chat?.members?.find(
    (m: any) => m.user.id !== userId
  );

  /*
  AUTO SCROLL
  */

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /*
  AUTO FOCUS
  */

  useEffect(() => {
    inputRef.current?.focus();
  }, [chat?.id]);

  /*
  SOCKET LISTENERS
  */

  useEffect(() => {

    if (!socket || !chat) return;

    const handleMessage = (message: any) => {

      if (message.chatId !== chat.id) return;

      setMessages(prev => {

        const exists = prev.some(m => m.id === message.id);
        if (exists) return prev;

        return [...prev, message];

      });

    };

    const handleTyping = ({ userId: typingUserId }: any) => {

      if (typingUserId === userId) return;

      setTypingUser(true);

      setTimeout(() => setTypingUser(false), 1500);

    };

    socket.on("receive-message", handleMessage);
    socket.on("typing", handleTyping);

    return () => {

      socket.off("receive-message", handleMessage);
      socket.off("typing", handleTyping);

    };

  }, [socket, chat?.id]);

  /*
  LOAD CHAT
  */

  useEffect(() => {

    if (!chat || !socket) return;

    setMessages([]);
    readMessagesRef.current.clear();

    socket.emit("join-chat", {
      chatId: chat.id,
      userId
    });

    fetch(`/api/messages/${chat.id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setMessages(data);
      });

  }, [chat?.id]);

  /*
  SEND TEXT
  */

  const sendMessage = () => {

    if (!input.trim()) return;

    socket.emit("send-message", {
      content: input,
      chatId: chat.id,
      userId
    });

    setInput("");

  };

  /*
  SEND IMAGE
  */

  const sendImage = async (file: File) => {

    try {

      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      socket.emit("send-message", {
        imageUrl: data.url,
        chatId: chat.id,
        userId
      });

    } catch (err) {
      console.error("Image upload failed", err);
    }

    setUploading(false);

  };

  /*
  MARK READ
  */

  const markAsRead = (message: any) => {

    if (!socket) return;
    if (message.userId === userId) return;

    if (readMessagesRef.current.has(message.id)) return;

    readMessagesRef.current.add(message.id);

    socket.emit("message-read", {
      messageId: message.id,
      userId,
      chatId: chat.id
    });

  };

  if (!chat) {
    return (
      <div
        style={{
          flex: 1,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b141a",
          color: "#8696a0"
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
        background: "#0b141a"
      }}
    >

      {/* HEADER */}

      <div
        style={{
          padding: 15,
          borderBottom: "1px solid #2a2f32",
          background: "#202c33",
          fontWeight: "bold"
        }}
      >
        {chat.isGroup
          ? chat.name
          : otherUser?.user?.name ||
            otherUser?.user?.mobile}
      </div>

      {/* MESSAGES */}

      <div
        style={{
          flex: 1,
          padding: 20,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column"
        }}
      >

        {messages.map((m) => {

          markAsRead(m);

          return (
            <MessageBubble
              key={m.id}
              message={m}
              own={m.userId === userId}
            />
          );

        })}

        {typingUser && (
          <div style={{ fontSize: 12, color: "#8696a0" }}>
            typing...
          </div>
        )}

        <div ref={bottomRef} />

      </div>

      {/* INPUT */}

      <div
        style={{
          display: "flex",
          padding: 10,
          background: "#111b21",
          borderTop: "1px solid #2a2f32",
          gap: 8
        }}
      >

        {/* IMAGE BUTTON */}

        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{
            padding: "10px",
            background: "#202c33",
            border: "none",
            borderRadius: 6,
            color: "white",
            cursor: "pointer"
          }}
        >
          📎
        </button>

        <input
          type="file"
          ref={fileRef}
          hidden
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) sendImage(file);
          }}
        />

        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type message"
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 6,
            border: "none",
            background: "#202c33",
            color: "white"
          }}
        />

        <button
          disabled={uploading}
          onClick={sendMessage}
          style={{
            padding: "10px 16px",
            background: "#25D366",
            border: "none",
            borderRadius: 6
          }}
        >
          {uploading ? "Uploading..." : "Send"}
        </button>

      </div>

    </div>

  );

}