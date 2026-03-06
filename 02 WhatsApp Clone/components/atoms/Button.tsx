// components/atoms/Button.tsx
"use client"

type Props = {
  children: React.ReactNode
  onClick?: () => void
}

export default function Button({ children, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 16px",
        backgroundColor: "#2a2f32",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer"
      }}
    >
      {children}
    </button>
  )
}