// components/molecules/MessageBubble.tsx
export default function MessageBubble({ message, own }: any) {
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
          maxWidth: "60%"
        }}
      >
        {message.content}
      </div>
    </div>
  )
}