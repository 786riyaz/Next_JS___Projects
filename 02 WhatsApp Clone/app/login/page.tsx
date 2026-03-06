// app/login/page.tsx
"use client"

import { useState } from "react"
import { setToken } from "@/lib/auth"

export default function Login() {
  const [mobile, setMobile] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = async () => {
    const res = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile, password })
    })

    const data = await res.json()

    if (data.token) {
      setToken(data.token)
      window.location.href = "/chat"
    } else {
      alert(data.message)
    }
  }

  return (
    <div style={container}>
      <h2>Login</h2>
      <input placeholder="Mobile" onChange={e => setMobile(e.target.value)} />
      <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
      <button onClick={handleLogin}>Login</button>
      <p onClick={() => (window.location.href = "/register")} style={{ cursor: "pointer" }}>
        Create account
      </p>
    </div>
  )
}

const container = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 10,
  width: 300,
  margin: "100px auto"
}