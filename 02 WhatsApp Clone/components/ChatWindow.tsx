// components/ChatWindow.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";

export default function ChatWindow({ chat, socket, userId }: any) {

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [typingUser, setTypingUser] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // prevent multiple read events
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
  AUTO FOCUS INPUT
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

    const handleDelivered = (data: any) => {

      if (!data || !data.chatId) return;

      setMessages(prev =>
        prev.map(m => {

          if (m.chatId !== data.chatId) return m;

          return {
            ...m,
            statuses: m.statuses?.map((s: any) => ({
              ...s,
              delivered: true
            }))
          };

        })
      );

    };

    const handleReadUpdate = ({ messageId }: any) => {

      if (!messageId) return;

      setMessages(prev =>
        prev.map(m => {

          if (m.id !== messageId) return m;

          return {
            ...m,
            statuses: m.statuses?.map((s: any) => ({
              ...s,
              read: true
            }))
          };

        })
      );

    };

    socket.on("receive-message", handleMessage);
    socket.on("typing", handleTyping);
    socket.on("messages-delivered", handleDelivered);
    socket.on("message-read-update", handleReadUpdate);

    return () => {

      socket.off("receive-message", handleMessage);
      socket.off("typing", handleTyping);
      socket.off("messages-delivered", handleDelivered);
      socket.off("message-read-update", handleReadUpdate);

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

    socket.emit("reset-unread", {
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

        if (Array.isArray(data)) {
          setMessages(data);
        }

      });

  }, [chat?.id]);

  /*
  SEND MESSAGE
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
  TYPING
  */

  const handleTyping = (value: string) => {

    setInput(value);

    socket.emit("typing", {
      chatId: chat.id,
      userId
    });

  };

  /*
  MARK MESSAGE READ (OPTIMIZED)
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

  /*
  EMPTY CHAT
  */

  if (!chat) {

    return (
      <div
        style={{
          flex: 1,
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

  /*
  UI
  */

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
          borderTop: "1px solid #2a2f32"
        }}
      >

        <input
          ref={inputRef}
          value={input}
          onChange={(e) => handleTyping(e.target.value)}
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
          onClick={sendMessage}
          style={{
            marginLeft: 10,
            padding: "10px 16px",
            background: "#25D366",
            border: "none",
            borderRadius: 6
          }}
        >
          Send
        </button>

      </div>

    </div>

  );

}