// server.ts

import next from "next"
import http from "http"
import { Server } from "socket.io"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const dev = process.env.NODE_ENV !== "production"
const app = next({ dev })
const handle = app.getRequestHandler()

const onlineUsers = new Map<string, string>()

app.prepare().then(() => {

  const server = http.createServer((req, res) => {

    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ status: "ok" }))
      return
    }

    handle(req, res)

  })

  const io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:3000",
        "https://0d137nlv-3000.inc1.devtunnels.ms"
      ],
      methods: ["GET", "POST"]
    }
  })

  io.on("connection", (socket) => {

    console.log("Socket connected:", socket.id)

    socket.on("user-online", (userId: string) => {
      onlineUsers.set(userId, socket.id)
      io.emit("online-users", Array.from(onlineUsers.keys()))
    })

    /*
    JOIN CHAT
    */

    socket.on("join-chat", async ({ chatId, userId }) => {

      const rooms = [...socket.rooms]

      for (const room of rooms) {
        if (room !== socket.id) socket.leave(room)
      }

      socket.join(chatId)

      await prisma.messageStatus.updateMany({
        where: {
          userId,
          delivered: false,
          message: { chatId }
        },
        data: { delivered: true }
      })

      io.to(chatId).emit("messages-delivered", { chatId })

    })

    /*
    RESET UNREAD
    */

    socket.on("reset-unread", async ({ chatId, userId }) => {

      await prisma.chatMember.updateMany({
        where: { chatId, userId },
        data: { unreadCount: 0 }
      })

      io.emit("unread-reset", { chatId, userId })

    })

    /*
    TYPING
    */

    socket.on("typing", (data) => {

      socket.to(data.chatId).emit("typing", {
        userId: data.userId
      })

    })

    /*
    SEND MESSAGE
    */

    socket.on("send-message", async (data) => {

      try {

        const message = await prisma.message.create({
          data: {
            content: data.content ?? null,
            imageUrl: data.imageUrl ?? null,
            chatId: data.chatId,
            userId: data.userId
          }
        })

        const members = await prisma.chatMember.findMany({
          where: { chatId: data.chatId }
        })

        for (const m of members) {

          await prisma.messageStatus.create({
            data: {
              messageId: message.id,
              userId: m.userId,
              delivered: m.userId !== data.userId
            }
          })

        }

        const fullMessage = await prisma.message.findUnique({
          where: { id: message.id },
          include: { statuses: true }
        })

        await prisma.chat.update({
          where: { id: data.chatId },
          data: { updatedAt: new Date() }
        })

        await prisma.chatMember.updateMany({
          where: {
            chatId: data.chatId,
            NOT: { userId: data.userId }
          },
          data: {
            unreadCount: { increment: 1 }
          }
        })

        /*
        SINGLE UNREAD EVENT
        */

        io.emit("chat-unread-update", {
          chatId: data.chatId,
          senderId: data.userId,
          message: fullMessage
        })

        io.to(data.chatId).emit("receive-message", fullMessage)

      }
      catch (err) {
        console.error("Message save error", err)
      }

    })

    /*
    MESSAGE READ
    */

    socket.on("message-read", async ({ messageId, userId, chatId }) => {

      await prisma.messageStatus.updateMany({
        where: { messageId, userId },
        data: { read: true }
      })

      io.to(chatId).emit("message-read-update", { messageId })

    })

    /*
    DISCONNECT
    */

    socket.on("disconnect", () => {

      for (const [userId, id] of onlineUsers.entries()) {
        if (id === socket.id) onlineUsers.delete(userId)
      }

      io.emit("online-users", Array.from(onlineUsers.keys()))

      console.log("Socket disconnected:", socket.id)

    })

  })

  server.listen(3000, () => {
    console.log("Server running on http://localhost:3000")
  })

})