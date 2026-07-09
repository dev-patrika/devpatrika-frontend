# Dev Patrika Frontend Redesign

A premium, production-ready developer intelligence platform built using React, JavaScript, Vite, and Tailwind CSS. The interface is fully integrated with the FastAPI backend engine to deliver real-time news summaries, AI-curated terminology wikis, trending GitHub repositories, and conversational RAG assistants.

---

## 🏗️ System Architecture & Design Choices

The platform is designed to look like state-of-the-art developer dashboards (Vercel, Linear, Cursor) with a focus on dark mode, high content density, and clean glassmorphism layouts.

### Key Technical Integrations
* **React + Vite**: Ultra-fast hot module replacement (HMR) and lightweight JavaScript compiler pipeline.
* **Tailwind CSS v4**: Built-in CSS-first configuration using `@theme` inside `src/index.css`.
* **Zod & React Hook Form**: Strictly validated schemas for custom concept submissions.
* **TanStack Query (React Query)**: Standardized server-side caching, background fetching, and optimistic updates.
* **Zustand**: Fast client-side state store for theme configuration, collapsing sidebar layouts, and conversational histories.
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

## 🔌 API Services Mapped

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
* **Available Models**: `/api/ai/models` -> `chatService.getChatModels()`
* **Server Health Status**: `/api/health` -> `healthService.checkHealth()`

---

## 🚀 Setup & Local Execution

### 1. Prerequisite (Run the Backend)
Start the FastAPI server on port 8000. In `devpatrika-backend`:
```bash
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --port 8000
```

### 2. Frontend Local Installation
Install node dependencies:
```bash
cd devpatrika-frontend
npm install
```

### 3. Run Dev Server
Launch Vite server (runs on port 3000):
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the intelligence platform.

### 4. Build for Production
Verify typescript compiles and bundles:
```bash
npm run build
```
