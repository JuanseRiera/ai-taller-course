# Research Assistant Dashboard

A professional, minimalist "Lab" style dashboard for an AI-driven research assistant. This frontend is built to interact with a multi-agent backend that streams research progress and final reports via Server-Sent Events (SSE).

## 🚀 Features

- **Real-time Streaming**: Handles complex agent workflows (Researcher → Writer → Reviewer) with live progress updates using `@microsoft/fetch-event-source`.
- **Minimalist "Lab" Aesthetic**: Clean light-gray theme (`bg-gray-50`) with crisp typography and professional borders.
- **Research History**: Persistent storage of past research queries and reports in Local Storage, accessible via a fixed sidebar.
- **Agent Trace Explorer**: A collapsible developer view providing a full vertical timeline of the conversation history between agents.
- **Markdown Rendering**: High-quality report display using `react-markdown` with support for tables, lists, and headers.
- **Fluid Transitions**: Smooth UI state changes (Form → Streaming → Report) powered by `framer-motion`.

## 🛠️ Technical Stack

- **Framework**: [Next.js 14 (App Router)](https://nextjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Markdown**: [react-markdown](https://github.com/remarkjs/react-markdown)
- **SSE**: [@microsoft/fetch-event-source](https://github.com/Azure/fetch-event-source)

## 📦 Installation

1. **Clone the repository** (if you haven't already).
2. **Navigate to the frontend directory**:
   ```bash
   cd labs/capstone-options/research-assistant-frontend
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```

## 🖥️ Usage

1. **Ensure the Backend is running**:
   By default, the dashboard expects the backend at `http://localhost:8000/research`.
2. **Start the Development Server**:
   ```bash
   npm run dev
   ```
3. **Open the Dashboard**:
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## 📡 Data Contract

The frontend communicates with the backend using the following protocol:

### Request (POST)
```json
{
  "question": "Your research topic...",
  "depth": "detailed",
  "report_format": "essay",
  "max_iterations": 5
}
```

### Events
- **Progress**: `{"type": "progress", "message": "...", "preview": "..."}`
- **Result**: `{"type": "result", "data": { "final_report": "...", "conversation_history": [...] }}`

## 📁 Project Structure

- `src/app`: Application routing and layout.
- `src/components`: UI components (Sidebar, ResearchForm, StreamingView, etc.).
- `src/hooks`: Custom `useResearchStream` hook for state and SSE management.
- `src/lib`: Types and utility functions.
