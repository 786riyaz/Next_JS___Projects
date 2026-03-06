// components/MessageBubble.tsx
"use client";

import { useState } from "react";

export default function MessageBubble({ message, own }: any) {

  const [imgLoaded, setImgLoaded] = useState(false);

  let ticks = "✓";
  let color = "#ccc";

  const delivered = message?.statuses?.some((s: any) => s.delivered);
  const read = message?.statuses?.some((s: any) => s.read);

  if (delivered) ticks = "✓✓";

  if (read) {
    ticks = "✓✓";
    color = "#53bdeb";
  }

  const time = message?.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      })
    : "";

  const downloadImage = () => {
    if (!message.imageUrl) return;

    const link = document.createElement("a");
    link.href = message.imageUrl;
    link.download = "chat-image";
    link.click();
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: own ? "flex-end" : "flex-start",
        marginBottom: 10
      }}
    >
      <div
        style={{
          background: own ? "#005c4b" : "#202c33",
          padding: 10,
          borderRadius: 8,
          maxWidth: "60%",
          color: "white"
        }}
      >

        {/* TEXT MESSAGE */}
        {message.content && (
          <div style={{ marginBottom: message.imageUrl ? 8 : 0 }}>
            {message.content}
          </div>
        )}

        {/* IMAGE MESSAGE */}
        {message.imageUrl && (
          <div style={{ position: "relative" }}>

            {!imgLoaded && (
              <div
                style={{
                  width: 250,
                  height: 150,
                  background: "#111",
                  borderRadius: 8
                }}
              />
            )}

            <img
              src={message.imageUrl}
              alt="sent"
              onLoad={() => setImgLoaded(true)}
              style={{
                maxWidth: 250,
                borderRadius: 8,
                display: imgLoaded ? "block" : "none",
                cursor: "pointer"
              }}
              onClick={() => window.open(message.imageUrl, "_blank")}
            />

            {/* DOWNLOAD BUTTON */}
            <button
              onClick={downloadImage}
              style={{
                marginTop: 4,
                fontSize: 11,
                background: "#111",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                padding: "2px 6px",
                cursor: "pointer"
              }}
            >
              Download
            </button>

          </div>
        )}

        {/* FOOTER */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            marginTop: 4,
            gap: 6
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: "#ccc"
            }}
          >
            {time}
          </span>

          {own && (
            <span
              style={{
                fontSize: 10,
                color,
                transition: "color 0.25s"
              }}
            >
              {ticks}
            </span>
          )}
        </div>

      </div>
    </div>
  );
}