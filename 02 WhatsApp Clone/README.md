# WhatsApp-Style Real-Time Chat Application

A **real-time messaging application** built with **Next.js, Socket.IO, Prisma, and PostgreSQL**.

This project replicates core features of **WhatsApp-style messaging**, including:

* Real-time messaging
* Message delivery & read receipts
* Typing indicators
* Unread message badges
* Image sharing
* User authentication
* Automatic chat creation

The application is designed to demonstrate **modern full-stack real-time architecture using Next.js App Router**.

---

# Tech Stack

### Frontend

* Next.js (App Router)
* React
* TypeScript
* Socket.IO Client

### Backend

* Next.js API Routes
* Custom Node.js server
* Socket.IO Server

### Database

* PostgreSQL
* Prisma ORM

### Authentication

* JWT
* bcrypt

### File Upload

* Local storage (`/public/uploads`)

---

# Features

## Authentication

* Register using **mobile number**
* Password hashing with **bcrypt**
* JWT authentication
* Protected API routes

## Chat System

* One-to-one personal chats
* Automatic chat creation
* Chat list with last message preview
* Unread message counters
* Chat sorting by recent activity

## Real-Time Messaging

* Instant message delivery
* Typing indicators
* Message delivery ticks
* Blue tick read receipts
* Live unread badge updates

## Media Messaging

* Send images
* Image preview inside chat
* Image download button
* Images stored locally

## UI Experience

* Auto scroll to latest message
* Auto focus on input field
* WhatsApp-style message layout
* Live updates without refresh

---

# Project Structure

```
project-root
│
├── app
│   ├── api
│   │   ├── register
│   │   ├── login
│   │   ├── users
│   │   ├── chats
│   │   ├── messages
│   │   ├── upload
│   │   └── chat
│   │       └── personal
│   │
│   └── chat
│       └── page.tsx
│
├── components
│   ├── Sidebar.tsx
│   ├── ChatWindow.tsx
│   └── MessageBubble.tsx
│
├── hooks
│   └── useSocket.ts
│
├── lib
│   ├── prisma.ts
│   ├── auth.ts
│   └── serverAuth.ts
│
├── prisma
│   └── schema.prisma
│
├── public
│   └── uploads
│
├── server.ts
└── README.md
```

---

# Database Models

## User

```
User
id
mobile
password
name
createdAt
```

## Chat

```
Chat
id
name
isGroup
updatedAt
```

## ChatMember

```
ChatMember
chatId
userId
unreadCount
```

## Message

```
Message
id
content
imageUrl
chatId
userId
createdAt
```

## MessageStatus

```
MessageStatus
messageId
userId
delivered
read
```

---

# Getting Started

This is a **Next.js project bootstrapped with create-next-app**.

## 1 Clone Repository

```bash
git clone https://github.com/786riyaz/Next_JS___Projects.git
cd chat-app
```

---

## 2 Install Dependencies

```bash
npm install
```

---

## 3 Start Database (Docker)

If using PostgreSQL via Docker:

```bash
docker-compose up -d
```

---

## 4 Setup Environment Variables

Create `.env` file:

```
DATABASE_URL="postgresql://user:password@localhost:5432/chatdb"

JWT_SECRET="your-secret-key"
```

---

## 5 Run Prisma Migration

```bash
npx prisma migrate dev
```

Optional migration:

```bash
npx prisma migrate dev --name message_status
```

Generate Prisma Client:

```bash
npx prisma generate
```

---

## 6 Create Upload Directory

Create this folder:

```
public/uploads
```

Images will be stored here.

---

# Running the Application

Start the development server:

```bash
npm run dev
```

Then open:

```
http://localhost:3000
```

The page auto-updates when you edit files.

---

# Real-Time Socket Server

The application uses a **custom Node.js server**.

File:

```
server.ts
```

Responsibilities:

* WebSocket communication
* Real-time messaging
* Delivery status updates
* Read receipts
* Unread counter updates
* Online user tracking

---

# API Endpoints

## Authentication

Register user

```
POST /api/register
```

Login

```
POST /api/login
```

---

## Users

Fetch all users

```
GET /api/users
```

---

## Chats

Get user chats

```
GET /api/chats
```

Create personal chat

```
POST /api/chat/personal
```

---

## Messages

Fetch chat messages

```
GET /api/messages/:chatId
```

Messages are sent via **Socket.IO**

---

## Upload API

Upload image

```
POST /api/upload
```

Response:

```
{
  "url": "/uploads/image.jpg"
}
```

---

# Socket Events

## Client → Server

```
send-message
typing
message-read
join-chat
reset-unread
```

## Server → Client

```
receive-message
typing
message-read-update
messages-delivered
chat-unread-update
online-users
unread-reset
```

---

# Image Upload Flow

```
User selects image
        ↓
POST /api/upload
        ↓
Image saved to /public/uploads
        ↓
Server returns image URL
        ↓
send-message socket event
        ↓
Message broadcast to chat
```

---

# Dev Tunnel / Remote Access

If accessing the app using **DevTunnel / Ngrok**, use:

```
window.location.origin
```

instead of hardcoding:

```
http://localhost:3000
```

Example:

```
const socket = io(window.location.origin)
```

---

# Deployment

The easiest way to deploy Next.js apps is via **Vercel**.

https://vercel.com/new

Documentation:

https://nextjs.org/docs/app/building-your-application/deploying

---

# Limitations

Current image storage uses **local disk**.

For production use:

* AWS S3
* Cloudinary
* UploadThing

---

# Future Improvements

Possible enhancements:

* Group chats
* Voice messages
* Video sharing
* Message editing
* Message deletion
* Online / offline status
* Push notifications
* Message search
* File sharing

---

# Learn More

Next.js Documentation
https://nextjs.org/docs

Learn Next.js
https://nextjs.org/learn

Next.js GitHub Repository
https://github.com/vercel/next.js

---

# License

MIT License

---

# Author

Developed as a **real-time chat application project** using modern full-stack technologies.
