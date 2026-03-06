// components/molecules/MessageBubble.tsx
"use client"

type Props = {
  message: string
  isOwn: boolean
}

export default function MessageBubble({ message, isOwn }: Props) {
  return (
    <div
      style={{
        alignSelf: isOwn ? "flex-end" : "flex-start",
        backgroundColor: isOwn ? "#005c4b" : "#202c33",
        padding: "10px",
        borderRadius: "8px",
        margin: "4px 0",
        maxWidth: "60%",
        color: "white"
      }}
    >
      {message}
    </div>
  )
}