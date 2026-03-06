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
      origin: "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  })

  io.on("connection", (socket) => {

    console.log("Socket connected:", socket.id)

    socket.on("user-online", (userId: string) => {

      onlineUsers.set(userId, socket.id)

      io.emit("online-users", Array.from(onlineUsers.keys()))

    })

    socket.on("join-chat", (chatId: string) => {

      const rooms = [...socket.rooms]

      for (const room of rooms) {
        if (room !== socket.id) {
          socket.leave(room)
        }
      }

      socket.join(chatId)

      console.log("User joined chat:", chatId)

    })

    socket.on("send-message", async (data) => {

      try {
        console.log("Saving message in chat:", data.chatId)
        const message = await prisma.message.create({
          data: {
            content: data.content,
            chatId: data.chatId,
            userId: data.userId
          }
        })

        io.to(data.chatId).emit("receive-message", message)

      }
      catch (err) {
        console.error("Message save error", err)
      }

    })

    socket.on("disconnect", () => {

      for (const [userId, id] of onlineUsers.entries()) {
        if (id === socket.id) {
          onlineUsers.delete(userId)
        }
      }

      io.emit("online-users", Array.from(onlineUsers.keys()))

      console.log("Socket disconnected:", socket.id)

    })

  })

  server.listen(3000, () => {
    console.log("Server running on http://localhost:3000")
  })

})