// hooks/useSocket.ts
"use client"

import { useEffect, useState } from "react"
import { io, Socket } from "socket.io-client"
import { getToken } from "@/lib/auth"

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    const token = getToken()

    const socketInstance = io("http://localhost:3000", {
      auth: { token }
    })

    socketInstance.on("connect", () => {
      console.log("Socket connected:", socketInstance.id)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  return socket
}