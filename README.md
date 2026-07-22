# 💻 Dev Patrika Frontend Redesign

A premium, production-ready developer intelligence platform dashboard built using **React**, **JavaScript**, **Vite**, and **Tailwind CSS**. 

The client interface is fully integrated with the FastAPI backend engine to deliver real-time news feeds, AI-curated terminology wikis, trending GitHub repositories, and conversational RAG assistants.

---

## 🏗️ UI Architecture & Design Choices

The platform is designed to emulate state-of-the-art developer dashboards (such as Vercel, Linear, and Cursor) with a focus on dark mode, high content density, and clean glassmorphic layouts.

### Key Front-End Integrations
* **React + Vite**: Fast hot module replacement (HMR) and lightweight compilation.
* **Tailwind CSS v4**: Built-in CSS-first configuration using `@theme` inside `src/index.css`.
* **Zod & React Hook Form**: Strictly validated schemas for search, chat inputs, and feedback forms.
* **TanStack Query (React Query)**: Standardized server-side caching, background fetching, and optimistic updates.
* **Zustand**: Fast client-side stores for theme settings, collapsing sidebar layout states, and session-based conversational histories.
* **Framer Motion**: Micro-interactions, slide-in concept drawers, and Command Palette overlays.

---

## 📂 Project Structure

```
src/
├── assets/             # Branding logo vectors
├── components/         # Global shared components
│   ├── ui/             # Radix & custom primitives (Button, Card, Input, Modal, Badge, Skeleton)
│   └── layout/         # Frame components (Sidebar, Header, Main Layout wrapper)
├── pages/              # Module Page Directories
│   ├── Dashboard/      # Dynamic analytics metrics and trends
│   ├── Feed/           # Daily news feed and detail overlays with related recommendations
│   ├── GitHub/         # Trending GitHub radar cards with AI 'why it matters' summaries
│   ├── Wiki/           # Autocomplete glossary list, reference links, and vertical evolution trees
│   ├── Reports/        # Weekly report archive reader and compiler trigger
│   ├── Chat/           # RAG Conversational chatbot with citation hovers and thread managers
│   ├── Search/         # Command Palette overlay (Ctrl+K)
│   └── Settings/       # Local cache purges and LLM configurations
├── services/           # Axios client configurations and endpoint service layers
├── store/              # Zustand uiStore and chatStore modules
├── utils/              # Helper formatting utilities
├── App.css             # Boilerplate overrides
├── App.jsx             # Main routing registry
├── index.css           # Tailwind v4 directives and color tokens
└── main.jsx            # Entry mount point
```

---

## 🔑 Authentication Flows Integrated

* **Passwordless OTP Login**: Enter email -> slide-in drawer requests OTP -> submit OTP code -> tokens saved in localStorage -> redirects to dashboard.
* **OAuth Login (Google & GitHub)**: Clicking OAuth buttons routes to backend OAuth url -> provider authorization -> redirect callback handling in client -> stores access and refresh tokens.
* **Token Rotation**: Axios interceptor automatically intercepts `401 Unauthorized` responses and requests a token refresh using the stored Refresh Token.

---

## 🔌 Frontend Service Mappings

* **Auth**: `/api/auth` -> `authService` (login, register, otp, google, github)
* **News Feeds**: `/api/news` -> `newsService.getNews(category, query, limit)`
* **Feed Crawler Trigger**: `/api/news/ingest` -> `newsService.triggerIngest()`
* **AI Processing Trigger**: `/api/news/process` -> `newsService.triggerProcess()`
* **Vector Recommendations**: `/api/news/{id}/related` -> `newsService.getRelatedNews(id)`
* **GitHub Open Source Radar**: `/api/github/trending` -> `githubService.getTrendingRepos()`
* **Dev Wiki Autocomplete**: `/api/wiki` -> `wikiService.getWikiEntries(q)`
* **Wiki Curation Trigger**: `/api/wiki/generate` -> `wikiService.generateWikiEntry(term)`
* **Evolution Timelines**: `/api/wiki/{term}/timeline` -> `wikiService.getWikiTimeline(term)`
* **Unified Cross-Search**: `/api/search` -> `searchService.unifiedSearch(q)`
* **Weekly Report Compile**: `/api/reports/weekly/compile` -> `reportService.compileWeeklyReport()`
* **RAG Conversational Chatbot**: `/api/ai/chat` -> `chatService.sendChatMessage(model, session_id, message)`
* **Server Health Status**: `/api/health` -> `healthService.checkHealth()`

---

## 🚀 Setup & Local Execution

### 1. Prerequisite: Start the Backend
Start the FastAPI server on port 8000. In the `Backend` directory:
```bash
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --port 8000
```

### 2. Install Node Dependencies
Open a terminal in the `Frontend` directory and run:
```bash
npm install
```

### 3. Run Development Server
Launch the Vite development server (runs on port 3000):
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
Verify compilation and bundle sizes:
```bash
npm run build
```
This outputs static assets into the `dist/` directory, optimized and ready for static hosting (Vercel, Netlify, Cloudflare Pages).
