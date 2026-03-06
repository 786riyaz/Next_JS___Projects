// components/atoms/Input.tsx
"use client"

type Props = {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
}

export default function Input({ value, onChange, placeholder }: Props) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        padding: "10px",
        borderRadius: "6px",
        border: "none",
        outline: "none",
        width: "100%",
        backgroundColor: "#202c33",
        color: "white"
      }}
    />
  )
}