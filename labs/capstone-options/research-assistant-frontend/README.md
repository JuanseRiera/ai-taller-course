# Research Assistant Dashboard

A professional, minimalist "Lab" style dashboard for an AI-driven research assistant. This frontend is built to interact with a multi-agent backend that streams research progress and final reports via Server-Sent Events (SSE).

## 🚀 Features

- **Real-time Streaming**: Handles complex agent workflows (Researcher → Writer → Reviewer) with live progress updates using `@microsoft/fetch-event-source`.
- **Minimalist "Lab" Aesthetic**: Clean light-gray theme (`bg-gray-50`) with crisp typography and professional borders.
- **Research History**: Persistent storage of past research queries and reports in Local Storage, accessible via a fixed sidebar.
- **Agent Trace Explorer**: A collapsible developer view providing a full vertical timeline of the conversation history between agents.
- **Structured Error Handling**: Frontend classifies failures into `NETWORK_ERROR`, `API_ERROR`, `STREAM_ERROR`, `TIMEOUT_ERROR`, and `UNKNOWN_ERROR`.
- **Traceable Requests**: Each research run gets a `traceId` and sends it as `X-Trace-Id` so frontend and backend logs can be correlated.
- **Safer Error UX**: Users see clear, non-technical messages by default, with a manual **Retry** action for retryable failures.
- **Global Error Boundary**: App-level fallback screen in `src/app/error.tsx` catches unexpected runtime rendering failures.
- **Markdown Rendering**: High-quality report display using `react-markdown` with support for tables, lists, and headers.
- **Fluid Transitions**: Smooth UI state changes (Form → Streaming → Report) powered by `framer-motion`.

## 🛠️ Technical Stack

- **Framework**: [Next.js 14 (App Router)](https://nextjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Markdown**: [react-markdown](https://github.com/remarkjs/react-markdown)
- **SSE**: [@microsoft/fetch-event-source](https://github.com/Azure/fetch-event-source)
- **Testing**: [Jest](https://jestjs.io/) + [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

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
4. **Create local environment file**:
   ```bash
   cp .env.example .env.local
   ```

## 🖥️ Usage

1. **Ensure the Backend is running**:
   By default, the dashboard expects the backend base URL at `http://localhost:8000`.
   You can override this with `NEXT_PUBLIC_API_BASE_URL` in `.env.local`.
2. **Start the Development Server**:
   ```bash
   npm run dev
   ```
3. **Open the Dashboard**:
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## ⚙️ Environment Variables

The project includes a tracked template file: `.env.example`.

Available variables:

- `NEXT_PUBLIC_API_BASE_URL`: Backend base URL used by the frontend.
  - Default/example: `http://localhost:8000`
  - The frontend appends `/research` internally.

Recommended setup:

```bash
cp .env.example .env.local
```

Then update values for your local/staging environment.

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

### Traceability Header

Every request includes:

```http
X-Trace-Id: <generated-trace-id>
```

This value is also stored in frontend state and logs, then shown as a reference ID in error screens.

## 🧯 Error Handling and Debugging

### Frontend error model

- `src/lib/errors.ts` defines normalized app errors and user-facing message mapping.
- `src/lib/types.ts` includes `ResearchError`, with `code`, `traceId`, `retryable`, optional `status`, and timestamp metadata.
- `src/hooks/useResearchStream.ts` translates unknown exceptions into a predictable `ResearchError` shape.

### Stream resiliency in `useResearchStream`

- Adds request-scoped trace IDs using `generateTraceId()`.
- Sends `X-Trace-Id` in request headers.
- Handles non-OK `onopen` responses with typed `ApiError` classification.
- Guards stream message parsing to avoid crash loops on malformed events.
- Applies stream inactivity timeout (`STREAM_TIMEOUT_MS`) and maps timeout failures to `TIMEOUT_ERROR`.
- Exposes `retryLastResearch()` for user-triggered retries.

### Logging

- `src/lib/logger.ts` provides structured `info/warn/error` logging.
- Logs include timestamp, level, message, and optional `traceId` + context.
- Logs are standardized for easier filtering in browser/devtools and backend logs.

### Error UI behavior

- `src/components/ErrorDisplay.tsx` presents generic, friendly messaging first.
- Technical details are hidden by default behind a toggle for internal debugging.
- Retry is shown only when an error is marked `retryable`.
- `src/app/error.tsx` provides a global fallback UI for uncaught runtime errors.

## 🔗 Backend Trace Correlation

Backend endpoint `POST /research` now reads and logs the incoming trace header:

- File: `../research-assistant-backend/src/app/main.py`
- Header read: `x-trace-id`
- Logged on request receipt and startup failure paths

This allows support/debug workflows to match:

1. User-facing reference ID from the frontend error screen
2. Browser frontend logs
3. Backend service logs for the same run

## 📁 Project Structure

- `src/app`: Application routing and layout.
- `src/components`: UI components (Sidebar, ResearchForm, StreamingView, etc.).
- `src/hooks`: Custom `useResearchStream` hook for state and SSE management.
- `src/lib`: Types and utility functions.
- `src/test`: Shared test factories for deterministic mock data.

## ✅ Testing Architecture

- **Runner**: Jest configured with `next/jest` in `jest.config.js`.
- **Test environment**: `jsdom` with shared setup in `jest.setup.ts`.
- **Test style**: Functional component tests and hook state-transition tests.
- **Mock strategy**: Mock `@microsoft/fetch-event-source` directly for deterministic SSE behavior.
- **Mock data pattern**: Factory functions in `src/test/factories.ts`.

### Test file placement

Tests live next to source files for discoverability:

- `src/components/*.test.tsx`
- `src/hooks/*.test.ts`
- `src/lib/*.test.ts`

### Mock data factories

Use factories with overrides to keep tests concise and consistent:

```ts
import { createMockHistoryItem } from "@/test/factories";

const item = createMockHistoryItem({ status: "draft", id: "draft-1" });
```

### Run tests

```bash
npm test
npm run test:watch
npm run test:coverage
```
