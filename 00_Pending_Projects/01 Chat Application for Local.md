# Software Requirements Specification (SRS)

# Next.js Real-Time Chat Application (WhatsApp-like)

---

# 1. Introduction

## 1.1 Purpose

This document defines the requirements for a **real-time chat application** built using **Next.js 16 (App Router)** that allows users to:

* Register and login
* Chat with other users
* Share files and images
* Make video calls
* Manage conversations

The application will run on a **local server environment** with a dedicated backend and database.

---

## 1.2 Scope

The system will provide:

* Real-time messaging using persistent WebSocket server
* Media and file sharing
* One-to-one video calls
* User authentication
* Contact-based chat system

Platform:

* Web application
* Mobile responsive

Technology Stack:

* Next.js 16
* Node.js server (custom server or standalone mode)
* WebSocket (Socket.IO or ws)
* PostgreSQL
* Local file storage
* WebRTC (for video calls)

---

## 1.3 Definitions

| Term      | Meaning                                       |
| --------- | --------------------------------------------- |
| RBAC      | Role Based Access Control                     |
| SSR       | Server Side Rendering                         |
| JWT       | JSON Web Token                                |
| WebRTC    | Real-Time Communication Protocol              |
| WebSocket | Persistent full-duplex communication protocol |

---

# 2. Overall Description

---

## 2.1 Product Perspective

Updated Local Architecture:

```
Browser
   ↓
Next.js Frontend
   ↓
Node.js Server (API + WebSocket)
   ↓
PostgreSQL Database
   ↓
Local File Storage (uploads/)
```

This is a **monolithic local architecture**.

---

## 2.2 System Architecture (Local Deployment)

### Frontend

Next.js App Router:

```
app/
 ├── login/
 ├── register/
 ├── chats/
 ├── chat/[id]/
 ├── profile/
```

---

### Backend

Custom Node.js server with:

* Next.js API Routes
* Integrated WebSocket Server (Socket.IO)
* Local file upload handling

Example:

```
server.js
```

---

### Services

| Service        | Purpose          |
| -------------- | ---------------- |
| Node.js Server | APIs + WebSocket |
| PostgreSQL     | Database         |
| Local Storage  | File uploads     |
| WebRTC         | Video calls      |

---

# 3. Functional Requirements

---

# 3.1 Authentication Module

---

## 3.1.1 User Registration

User must be able to:

* Create account
* Enter:

  * Name
  * Email
  * Password

API:

```
POST /api/auth/register
```

System must:

* Hash password using bcrypt
* Store user in database

---

## 3.1.2 Login

User must be able to login.

API:

```
POST /api/auth/login
```

System must:

* Validate credentials
* Generate JWT
* Store secure HTTP-only cookie

---

## 3.1.3 Logout

API:

```
POST /api/auth/logout
```

System must clear authentication cookie.

---

# 3.2 User Module

---

## 3.2.1 User Profile

User can:

* Update name
* Update profile photo

Profile photos stored in:

```
/uploads/profile/
```

---

## 3.2.2 User Search

API:

```
GET /api/users/search?q=John
```

---

# 3.3 Chat Module

---

## 3.3.1 Create Chat

API:

```
POST /api/chats
```

Payload:

```
userId
```

---

## 3.3.2 Get Chats

API:

```
GET /api/chats
```

Response:

```
chatId
lastMessage
timestamp
user
```

---

# 3.4 Messaging Module

---

## 3.4.1 Send Message

API:

```
POST /api/messages
```

Payload:

```
chatId
message
type
```

---

## 3.4.2 Receive Messages (Realtime)

Technology:

```
WebSocket (Socket.IO)
```

System must:

* Maintain persistent connection
* Emit message events
* Join users to chat rooms
* Broadcast to room participants

---

## 3.4.3 Message Status

Support:

* Sent
* Delivered
* Read

Status updated via WebSocket events.

---

# 3.5 File Sharing Module

---

## 3.5.1 Upload Image

API:

```
POST /api/upload/image
```

Supported:

* JPG
* PNG
* WEBP

Max:

```
10MB
```

Stored in:

```
/uploads/images/
```

---

## 3.5.2 Upload File

Supported:

* PDF
* DOC
* ZIP

Max:

```
50MB
```

Stored in:

```
/uploads/files/
```

---

## 3.5.3 Download File

API:

```
GET /api/file/:id
```

Server streams file from local storage.

---

# 3.6 Video Call Module

---

## 3.6.1 One-to-One Video Call

Technology:

```
WebRTC (Peer-to-Peer)
```

Signaling handled via:

```
WebSocket (Socket.IO)
```

Users can:

* Initiate call
* Accept call
* Reject call
* End call

---

## 3.6.2 Call Features

Support:

* Video
* Audio
* Mute/Unmute
* End Call

---

# 3.7 Notification Module

---

Support:

* In-app notifications
* Call notifications

Handled via:

```
WebSocket events
```

---

# 4. Non Functional Requirements

---

# 4.1 Performance

* Message latency < 200ms (local network)
* API response < 100ms (local)

---

# 4.2 Scalability

Initial target:

```
1,000 concurrent users (local server)
```

System must support horizontal scaling in future.

---

# 4.3 Security

Must include:

* HTTPS (optional in production)
* JWT Authentication
* Secure Cookies
* Password hashing (bcrypt)
* Input validation
* XSS Protection
* Rate limiting
* File type validation

---

# 4.4 Availability

Target uptime:

```
99% (local server dependent)
```

---

# 5. Database Design

---

## users

```
id
name
email (unique)
password
image
createdAt
```

---

## chats

```
id
createdAt
```

---

## chatUsers

```
chatId
userId
```

---

## messages

```
id
chatId
senderId
message
type
fileUrl
createdAt
status
```

---

# 6. API Specification

---

## Authentication

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
```

---

## Users

```
GET /api/users
GET /api/users/search
PUT /api/users/profile
```

---

## Chats

```
GET /api/chats
POST /api/chats
```

---

## Messages

```
GET /api/messages
POST /api/messages
```

---

## Upload

```
POST /api/upload/image
POST /api/upload/file
GET  /api/file/:id
```

---

# 7. UI Requirements

---

## Pages

```
/
login
register
chats
chat/[id]
profile
```

---

## Layout

Left Panel:

```
Chat List
```

Right Panel:

```
Messages
```

---

# 8. Deployment Requirements

---

## Environment

Local Machine:

```
Node.js >= 20
PostgreSQL (local installation)
```

---

## Server Execution

Option 1: Next.js standalone

```
npm run build
npm start
```

Option 2: Custom server

```
node server.js
```

---

## File Storage

```
/uploads/
```

Must exist before server start.

---

# 9. Folder Structure

```
app/
 ├── login/
 ├── register/
 ├── chats/
 ├── chat/[id]/
 ├── profile/
 │
 ├── api/
 │    ├── auth/
 │    ├── users/
 │    ├── chats/
 │    ├── messages/
 │    └── upload/

server/
 ├── socket.js
 ├── server.js

uploads/
 ├── images/
 ├── files/
 ├── profile/

prisma/
lib/
components/
```

---

# 10. Future Enhancements

* Group chat
* Voice messages
* Message encryption (E2E)
* Message reactions
* Admin dashboard
* Docker containerization
* Deployment on cloud infrastructure (optional)

---

# ⭐ Final Result

This SRS now defines a **production-ready WhatsApp-style application for local server deployment** that:

✔ Runs fully on local machine
✔ Uses persistent WebSocket server
✔ Uses PostgreSQL locally
✔ Stores files locally
✔ Supports real-time chat
✔ Supports video calls
✔ No external cloud dependencies

---