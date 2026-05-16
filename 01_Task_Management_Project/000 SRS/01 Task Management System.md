Here is a **fully expanded and professional version of your prompt** so a developer (or AI) can build a **complete production-level Next.js application** with **frontend + backend + RBAC + authentication + task system**.

This is a **clean Software Requirement Specification (SRS-style prompt)** you can use.

---

# Complete System Prompt – Next.js Fullstack Application

## 1. Project Overview

Build a **full-stack web application using Next.js** with **frontend and backend integrated**.

The system is a **Task Management System with Role-Based Access Control (RBAC)** where:

* Users can register and login
* Managers can assign tasks
* Users can update task status
* Admins can manage the system
* Authentication and authorization must be secure
* UI must support theme switching (Dark/Light mode)
* Tasks must show relative timestamps (example: *10 minutes ago*)

The application must follow **production-level architecture and folder structure**.

---

# 2. Tech Stack Requirements

### Frontend

* Next.js (Pages Router or App Router – specify clearly)
* TypeScript
* TailwindCSS
* React Hook Form
* Zod validation
* Axios or Fetch API
* Context API or Zustand for state management

---

### Backend

Use Next.js API Routes as backend.

Required:

* REST APIs
* JWT Authentication
* RBAC Middleware
* Prisma ORM
* MySQL or PostgreSQL database

---

### Database ORM

Prisma ORM must be used.

Entities:

* Users
* Roles
* Tasks
* Tickets (optional)
* Sessions (optional)

---

### Authentication

Authentication must include:

* Register
* Login
* Logout
* JWT tokens
* Refresh tokens (optional)
* Password hashing using bcrypt

---

### Authorization

RBAC Roles:

### 1. Admin

Admin can:

* Create users
* Update users
* Delete users
* Assign roles
* View all users
* View all tasks
* Modify any task
* View reports

---

### 2. Manager

Manager can:

* View users
* Assign tasks
* Update tasks
* View assigned tasks
* View team progress

---

### 3. User

User can:

* Register
* Login
* View profile
* Edit profile
* View assigned tasks
* Update task status

User CANNOT:

* Assign tasks
* Delete tasks
* See other users tasks

---

# 3. Main Features

---

# Authentication Features

### Register

User can register with:

* Name
* Email
* Password
* Phone

Password must be hashed.

---

### Login

Login using:

* Email
* Password

System returns:

* JWT Token
* User role

---

### Logout

Logout clears token.

---

### Authorization Middleware

Middleware must verify:

* Token valid
* Role valid
* Permission valid

---

# Profile Management

Users can:

* Update name
* Update password
* Update phone

Admin can:

* Update any user profile

---

# Task System

### Task Fields

Task should include:

* Task ID
* Title
* Description
* Assigned User
* Assigned By
* Status
* Priority
* Created Date
* Updated Date

---

### Task Status Types

* Pending
* In Progress
* Completed

---

### Priority Types

* Low
* Medium
* High

---

### Task Features

Manager can:

* Assign task
* Edit task
* Delete task

User can:

* View assigned tasks
* Change status

Admin can:

* See all tasks
* Modify all tasks

---

# Time Display Feature

Tasks must show relative time:

Examples:

* 5 minutes ago
* 2 hours ago
* 1 day ago

Use:

```
date-fns
or
dayjs
```

---

# Theme Switching

Theme options:

* Light
* Dark

Features:

* Toggle button
* Save preference in localStorage

---

# Admin Dashboard

Admin Dashboard must include:

* Total Users
* Total Tasks
* Pending Tasks
* Completed Tasks

---

# Manager Dashboard

Manager Dashboard must include:

* Assigned Tasks
* Team Tasks
* Progress Summary

---

# User Dashboard

User Dashboard must include:

* Assigned Tasks
* Completed Tasks
* Pending Tasks

---

# RBAC Design

### Role Table

| Role    |
| ------- |
| Admin   |
| Manager |
| User    |

---

### Permission Logic

Use:

```
Middleware
OR
RBAC utility
```

Example:

```
canCreateTask(role)
canDeleteUser(role)
```

---

# Folder Structure (Required)

```
project-root/

app/
    layout.tsx
    page.tsx

    login/
        page.tsx

    register/
        page.tsx

    dashboard/
        page.tsx

    profile/
        page.tsx

    tasks/
        page.tsx

    admin/
        users/
            page.tsx
        tasks/
            page.tsx

    manager/
        tasks/
            page.tsx


api/
    auth/
        login.ts
        register.ts
        logout.ts

    users/
        index.ts
        [id].ts

    tasks/
        index.ts
        [id].ts

components/

    layout/
        Navbar.tsx
        Sidebar.tsx

    ui/
        Button.tsx
        Input.tsx

    tasks/
        TaskCard.tsx
        TaskForm.tsx

lib/

    prisma.ts
    auth.ts
    rbac.ts
    middleware.ts
    validators.ts

prisma/

    schema.prisma

types/

    user.ts
    task.ts

utils/

    dateFormat.ts

context/

    AuthContext.tsx
    ThemeContext.tsx

styles/

    globals.css

middleware.ts

.env

package.json
```

---

# Database Schema Requirements

### User Table

```
id
name
email
password
role
phone
createdAt
updatedAt
```

---

### Task Table

```
id
title
description
status
priority
assignedTo
assignedBy
createdAt
updatedAt
```

---

# Security Requirements

Must include:

### Password Security

* bcrypt hashing

---

### Token Security

* JWT expiration

---

### API Protection

Protected APIs:

```
/api/tasks/*
/api/users/*
```

---

# Validation Requirements

Use:

```
Zod
```

Example:

```
Email validation
Password min 6 chars
```

---

# Error Handling

Proper API errors:

```
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
500 Server Error
```

---

# UI Requirements

Must include:

* Responsive design
* Sidebar navigation
* Navbar
* Loading spinners
* Error messages
* Success messages

---

# Extra Features (Advanced)

### Search

Search users.

Search tasks.

---

### Filters

Filter tasks by:

* Status
* Priority
* User

---

### Pagination

Required for:

* Users
* Tasks

---

### Sorting

Sort by:

* Date
* Priority

---

### Notifications

Optional:

* Task assigned notification

---

### Activity Log

Track:

* User login
* Task assigned
* Task updated

---

### Audit Trail

Admin can see:

* Who modified task
* When modified

---

# DevOps Requirements

Must include:

```
Dockerfile
docker-compose.yml
```

---

# Testing Requirements

Must include:

```
Cypress
or
Jest
```

Basic tests:

* Login test
* Register test
* Task creation test

---

# Environment Variables

```
DATABASE_URL=

JWT_SECRET=

NEXT_PUBLIC_API_URL=
```

---

# Expected Output

Generate:

1. Full Next.js Project
2. Frontend Code
3. Backend Code
4. Prisma Schema
5. Middleware
6. RBAC Logic
7. Authentication Logic
8. API Routes
9. Folder Structure
10. Sample Data

---

# Important Requirements

Code must be:

* Clean
* Scalable
* Production ready
* Proper comments
* Best practices
