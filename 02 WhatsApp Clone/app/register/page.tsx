// app/register/page.tsx
"use client"

import { useState } from "react"

export default function Register() {
  const [mobile, setMobile] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")

  const handleRegister = async () => {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile, password, name })
    })

    const data = await res.json()

    if (res.ok) {
      alert("Registered successfully")
      window.location.href = "/login"
    } else {
      alert(data.message)
    }
  }

  return (
    <div style={container}>
      <h2>Register</h2>
      <input placeholder="Name" onChange={e => setName(e.target.value)} />
      <input placeholder="Mobile" onChange={e => setMobile(e.target.value)} />
      <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
      <button onClick={handleRegister}>Register</button>
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