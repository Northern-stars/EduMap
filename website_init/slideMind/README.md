# SlideMind — Concept-Linked Mind Map

An AI-powered concept-linking mind mapping tool that allows users to **proactively build their own knowledge networks** by uploading materials, selecting concepts, and dragging to create connections.

> Design Philosophy: Shift away from the pattern of simply asking large language models questions, towards organizing your own note format and finding your own connection frameworks.

---

## ✨ Core Features

- 📤 **Smart Upload** — Supports PPTX, PDF, and image formats
- 🤖 **AI Summary** — Automatically extracts key concepts
- 🧠 **Concept Cards** — Visual management of knowledge nodes
- 🔗 **Concept Linking** — Hold Shift to connect related concepts
- 💬 **AI Chat** — Aware of selected concepts, intelligent assistance

---

## 🎯 How It Works

```
Step 1: Upload Slides (PPTX/PDF/Images)
   ↓
Step 2: Read AI-generated summaries
   ↓
Step 3: Click to add concepts manually (or add all at once)
   ↓
Step 4: Drag and connect on the canvas to build your mind map
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Frontend
cd client
npm install

# Backend
cd ../server
npm install
```

### 2. Configure API Key

```bash
# Edit server/.env
MINIMAX_API_KEY=your_MiniMax_API_Key
```

Get your API Key: https://www.minimax.chat/

### 3. Start Services

```bash
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend
cd client && npm run dev
```

### 4. Access

Open your browser: **http://localhost:3000**

---

## ⌨️ Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Link concepts | Shift + Click two cards |
| Pan canvas | Space + Mouse drag |
| Multi-select cards | Cmd/Ctrl + Click |
| Delete selected | Delete |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 + React 18 + TypeScript |
| Styling | Tailwind CSS (Lovart AI style) |
| State Management | Zustand |
| Backend | Express.js |
| AI | MiniMax API (MiniMax-M2) |
| File Parsing | JSZip (PPTX), pdf-parse (PDF) |

---

## 📁 Project Structure

```
slideMind/
├── client/                    # Next.js frontend
│   ├── app/                  # Page components
│   ├── components/          # UI components
│   │   ├── Canvas/          # Canvas-related
│   │   ├── Chat/            # Chat panel
│   │   └── Slides/           # Upload-related
│   └── lib/                 # State management
│
├── server/                    # Express backend
│   ├── routes/               # API routes
│   │   ├── slides.js        # File upload & parsing
│   │   ├── concepts.js      # Concept card CRUD
│   │   └── chat.js          # AI chat
│   └── services/
│       ├── minimax.js        # MiniMax API
│       └── slide-parser.js   # PPTX/PDF parsing
│
├── SPEC.md                    # Detailed design specification
└── README.md                  # This file
```

---

## 🔧 FAQ

### Q: No summary generated after upload?

1. Check if the server is running:
   ```bash
   curl http://localhost:3001/api/health
   ```
2. Check if API Key is configured in `.env`
3. Check server logs

### Q: AI returns demo content?

Make sure the API Key in `.env` is correct and the server has been restarted

### Q: Canvas won't drag?

Try refreshing the page, or check if Space key is being held down

---

## 📦 Deployment

### Frontend Build
```bash
cd client
npm run build  # Output in .next/
```

### Backend Deployment
- Requires Node.js 18+
- Use PM2 to manage processes
- HTTPS recommended for production

### Production Recommendations
- Use PostgreSQL/MySQL instead of in-memory storage
- Consider adding user authentication
- Consider adding a vector database for RAG

---

## 🔐 Security Notes

- Do not commit `.env` to Git
- API Key is server-side only
- Consider adding file upload size limits

---

## 📄 License

MIT License

---

*Last updated: 2026-03-28*
