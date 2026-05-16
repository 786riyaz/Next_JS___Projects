# 🚀 Next.js Fullstack Application

*PostgreSQL + Prisma + Docker Setup*

This is a **Next.js** full-stack application built using:

* ⚡ **Next.js (App Router)**
* 🐘 **PostgreSQL**
* 🔷 **Prisma ORM**
* 🐳 **Docker Compose**
* 🟢 **Node.js ≥ 20.9.0**

---

## 📦 Tech Stack

| Layer     | Technology           |
| --------- | -------------------- |
| Frontend  | Next.js (App Router) |
| Backend   | Next.js API Routes   |
| Database  | PostgreSQL           |
| ORM       | Prisma               |
| Container | Docker Compose       |

---

# 🛠️ Project Setup (Local Development)

---

## 1️⃣ Prerequisites

Make sure you have installed:

* **Node.js ≥ 20.9.0**
* **Docker & Docker Compose**
* **NPM / Yarn / PNPM**
* **Git**

Check versions:

```bash
node -v
docker -v
```

---

## 2️⃣ Clone the Repository

```bash
git clone https://github.com/786riyaz/Next_JS___Projects.git
cd 01 Task Management Project
```

---

## 3️⃣ Install Dependencies

```bash
npm install
```

or

```bash
yarn install
```

---

# 🐳 4️⃣ Start PostgreSQL using Docker

This project uses **Docker Compose** to create a PostgreSQL container.

Start database:

```bash
docker compose up -d
```

Verify container:

```bash
docker ps
```

Stop database:

```bash
docker compose down
```

---

# 🗄️ 5️⃣ Prisma Setup

---

## 📌 Run Database Migrations

```bash
npx prisma migrate dev
```

This will:

* Create database schema
* Generate Prisma Client
* Sync schema with PostgreSQL

---

## 🌱 Seed Database

```bash
npx prisma db seed
```

This will insert initial data into your database.

---

# ▶️ 6️⃣ Run Development Server

```bash
npm run dev
```

Then open:

```
http://localhost:3000
```

The app will automatically reload when you modify:

```
app/page.tsx
```

---

# 📁 Project Structure

```
.
├── app/
│   ├── api/
│   ├── page.tsx
│   └── layout.tsx
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── docker-compose.yml
├── package.json
├── .env
└── README.md
```

---

# 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/taskdb"
```

⚠️ Make sure credentials match your `docker-compose.yml`.

---

# 🧪 Prisma Useful Commands

Generate Prisma Client:

```bash
npx prisma generate
```

Open Prisma Studio:

```bash
npx prisma studio
```

Reset database:

```bash
npx prisma migrate reset
```

---

# 🏗️ Production Build

Build project:

```bash
npm run build
```

Start production server:

```bash
npm start
```

---

# 📌 Important Notes

* `.next` folder **should NOT be committed** to Git.
* Make sure `.env` is added to `.gitignore`.
* Docker must be running before starting the database.
* Always run migrations after schema changes.

---

# 📚 Learn More

* [Next.js Documentation](https://nextjs.org/docs)
* [Prisma Documentation](https://www.prisma.io/docs)
* [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

# 👨‍💻 Author

**Riyaz Khan --- 786riyaz**

---

# 📝 License

This project is licensed under the MIT License.

---