// hooks/useSocket.ts
"use client"

import { useEffect, useRef, useState } from "react"
import { io, Socket } from "socket.io-client"
import { getToken } from "@/lib/auth"

export const useSocket = () => {

  const socketRef = useRef<Socket | null>(null)
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {

    const token = getToken()

    if (socketRef.current) return

    // Use current origin instead of localhost
    const socketUrl = window.location.origin

    const socketInstance = io(socketUrl, {
      auth: { token },
      transports: ["websocket"]
    })

    socketInstance.on("connect", () => {
      console.log("Socket connected:", socketInstance.id)
    })

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected")
    })

    socketRef.current = socketInstance
    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
      socketRef.current = null
    }

  }, [])

  return socket
}