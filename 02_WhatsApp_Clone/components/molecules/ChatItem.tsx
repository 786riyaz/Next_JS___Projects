// components/molecules/ChatItem.tsx
"use client"

type Props = {
  name: string
  lastMessage?: string
  onClick?: () => void
}

export default function ChatItem({ name, lastMessage, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "12px",
        borderBottom: "1px solid #2a2f32",
        cursor: "pointer"
      }}
    >
      <div style={{ fontWeight: "bold" }}>{name}</div>
      <div style={{ fontSize: "12px", color: "#8696a0" }}>
        {lastMessage}
      </div>
    </div>
  )
}