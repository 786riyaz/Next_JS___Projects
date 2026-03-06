"use client";

export default function MessageBubble({ message, own }: any) {

  let ticks = "✓";
  let color = "#ccc";

  const delivered = message.statuses?.some((s: any) => s.delivered);
  const read = message.statuses?.some((s: any) => s.read);

  if (delivered) ticks = "✓✓";
  if (read) {
    ticks = "✓✓";
    color = "#53bdeb";
  }

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });

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

        <div>{message.content}</div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            marginTop: 4,
            gap: 6
          }}
        >

          {/* TIME */}

          <span
            style={{
              fontSize: 10,
              color: "#ccc"
            }}
          >
            {time}
          </span>

          {/* TICKS */}

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