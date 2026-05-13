# 📚 Learning Manager

A full-stack Next.js application for managing your learning resources — YouTube videos, reference links, notes, and topic priorities — all in one dark-themed dashboard.

---

## ✨ Features

- **Domain Priorities** — Manage topics with module order and learn priority. Drag-free reordering via ▲▼ buttons. Excel import/export.
- **YouTube Videos** — Track videos with auto-fetched titles/channels from YouTube oEmbed. Series and download status tracking. Excel import/export.
- **Other Learning Links** — Categorized reference links with sortable table. Excel import/export.
- **Notes** — Pinnable note cards with category filtering. Excel import/export.
- **Settings** — Configure default domain, domain order, and per-domain colors — all persisted to MongoDB.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript + JavaScript |
| Database | MongoDB (via Mongoose 9) |
| Styling | Tailwind CSS v4 |
| Excel | xlsx + file-saver |
| Runtime | Node.js 18+ |

---

## 📋 Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- A **MongoDB** database (local or MongoDB Atlas)

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd learning-manager
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
```

> **Local MongoDB:** `MONGODB_URI=mongodb://localhost:27017/learning-manager`

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The app redirects to `/videos` by default.

---

## 📁 Project Structure

```
learning-manager/
├── app/
│   ├── api/
│   │   ├── links/
│   │   │   ├── route.js          # GET all, POST new link
│   │   │   └── [id]/route.js     # PUT, DELETE link
│   │   ├── notes/
│   │   │   ├── route.js          # GET all, POST new note
│   │   │   └── [id]/route.js     # PUT, DELETE note
│   │   ├── priorities/
│   │   │   ├── route.js          # GET all, POST new priority
│   │   │   └── [id]/route.js     # PUT, DELETE priority
│   │   ├── settings/
│   │   │   └── route.js          # GET all settings, POST upsert setting
│   │   ├── videos/
│   │   │   ├── route.js          # GET all, POST new video
│   │   │   └── [id]/route.js     # PUT, DELETE video
│   │   └── youtube-meta/
│   │       └── route.js          # Fetch YouTube title/channel via oEmbed
│   ├── links/page.js             # Links management page
│   ├── notes/page.js             # Notes management page
│   ├── priorities/page.js        # Domain priorities page
│   ├── settings/page.js          # App settings page
│   ├── videos/page.js            # YouTube videos page
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout with Sidebar
│   └── page.tsx                  # Root redirect → /videos
├── components/
│   ├── ComboBox.js               # Searchable dropdown input
│   └── Sidebar.js                # Navigation sidebar
├── lib/
│   ├── domainColors.js           # Color palette + color map builder
│   ├── mongodb.js                # Mongoose connection with caching
│   └── useSettings.js            # Settings hook (optional utility)
├── models/
│   ├── Link.js                   # Mongoose Link schema
│   ├── Note.js                   # Mongoose Note schema
│   ├── Priority.js               # Mongoose Priority schema
│   ├── Setting.js                # Mongoose Setting schema (key/value)
│   └── Video.js                  # Mongoose Video schema
├── .env.local                    # ← you create this (not committed)
├── next.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 🗄 MongoDB Collections

| Collection | Purpose |
|-----------|---------|
| `links` | Reference URLs with category/topic/subtopic |
| `notes` | Text notes with category and pin status |
| `priorities` | Domain+topic pairs with moduleOrder and learnPriority |
| `settings` | Key/value store for app configuration |
| `videos` | YouTube videos with domain/topic/priority metadata |

No manual schema setup needed — Mongoose creates collections automatically on first write.

---

## ⚙️ Settings (persisted in MongoDB)

| Key | Type | Description |
|-----|------|-------------|
| `defaultDomain` | string | Pre-selected domain filter on load |
| `domainOrder` | string[] | Display order of domain filter buttons |
| `domainColorOverrides` | object | Per-domain color index overrides |

Configure these at `/settings` in the app UI.

---

## 📦 Available Scripts

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run start    # Start production server (run build first)
npm run lint     # Run ESLint
```

---

## 📊 Excel Import Format

### Priorities (`priorities.xlsx`)
| Domain | Topic | Module Order | Learn Priority |
|--------|-------|-------------|---------------|
| Web Dev | React | 1.1 | 5 |

### Videos (`videos.xlsx`)
| Domain | Topic | Priority | Video Name | Channel Name | YouTube Link | Series | Downloaded |
|--------|-------|----------|-----------|-------------|-------------|--------|-----------|
| Web Dev | React | 5 | React Hooks | Fireship | https://... | No | No |

### Links (`links.xlsx`)
| Category | Topic | Subtopic | Reference |
|---------|-------|---------|-----------|
| API Design | REST | Best practices | https://... |

### Notes (`notes.xlsx`)
| Title | Content | Category | Pinned |
|-------|---------|---------|--------|
| My Note | Note content here | General | No |

---

## 🚢 Production Deployment

### Build and start

```bash
npm run build
npm run start
```

### Environment variable (production)

Set `MONGODB_URI` in your hosting platform's environment config (Vercel, Railway, etc.).

### Deploy to Vercel (recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set env var
vercel env add MONGODB_URI
```

---

## 🔧 Troubleshooting

**MongoDB connection error**
- Verify `MONGODB_URI` in `.env.local` is correct
- For Atlas: whitelist your IP address in Network Access
- For local: ensure `mongod` is running

**YouTube auto-fill not working**
- The YouTube oEmbed API is public and rate-limited; private/restricted videos won't return metadata

**Excel import skipping rows**
- Duplicate detection: priorities skip duplicate domain+topic combos and duplicate learnPriority values; videos skip duplicate YouTube URLs; links skip duplicate reference URLs; notes skip duplicate titles

**Domain filter showing 0 results after settings change**
- Domain names in Settings must match the domain names stored in your DB exactly (case and spaces matter). The app attempts a normalized match (ignoring spaces/case) as fallback.
