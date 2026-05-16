// components/organisms/MessageInput.tsx
"use client"

import { useState } from "react"
import Input from "../atoms/Input"
import Button from "../atoms/Button"

export default function MessageInput() {
  const [message, setMessage] = useState("")

  const sendMessage = () => {
    console.log("Send:", message)
    setMessage("")
  }

  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        padding: "10px",
        backgroundColor: "#111b21"
      }}
    >
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message"
      />
      <Button onClick={sendMessage}>Send</Button>
    </div>
  )
}