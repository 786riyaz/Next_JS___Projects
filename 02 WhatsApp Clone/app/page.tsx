// app/page.tsx
"use client"

import { useEffect } from "react"
import { getToken } from "@/lib/auth"

export default function Home() {
  useEffect(() => {
    const token = getToken()
    if (token) window.location.href = "/chat"
    else window.location.href = "/login"
  }, [])

  return null
}