# TaskFlow

A small task-management application that demonstrates a clean separation between an Express + TypeScript REST API and a React + TypeScript single-page client, with a focus on **code clarity, type safety, error handling, and input validation** over feature breadth.

---

## Table of Contents
1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Setup & Run](#setup--run)
5. [API Reference](#api-reference)
6. [Architecture & Assumptions](#architecture--assumptions)
7. [Libraries Used](#libraries-used)

---

## Overview

The application manages a list of tasks. Each task has a `title`, `description`, `status` (`pending` | `in_progress` | `completed`), `priority` (`low` | `medium` | `high`), and a `createdAt` timestamp. The user can:

- View all tasks
- Create a new task (with status and priority)
- Update a task's status, priority, or any other field via the API
- Delete a task
- **Filter** the visible list by status (To Do / In Progress / Done / All)
- **Sort** the visible list by creation date or priority

Tasks are stored **in memory on the server**. The data layer is wrapped in a Repository abstraction so that swapping to a real database would touch a single file.

---

## Tech Stack

### Server
- **Node.js** (18+ recommended — uses `crypto.randomUUID()` from stdlib)
- **Express 4** for HTTP routing
- **TypeScript** in `strict` mode for end-to-end type safety
- **cors** middleware for cross-origin requests from the Vite dev server
- **dotenv** for environment variables
- **ts-node-dev** for hot-reload in development

### Client
- **React 18** with functional components and hooks
- **TypeScript** in `strict` mode
- **Vite** as the build tool and dev server (with a proxy to the API)
- **Native `fetch`** — no axios dependency, keeping the API client minimal and explicit
- **Plain CSS** co-located with each component

---

## Project Structure

```
TaskFlow/
├── README.md
├── .gitignore
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env
│   └── src/
│       ├── index.ts                 # Bootstrap: load env, start HTTP server
│       ├── app.ts                   # Build Express app (no listen) — keeps app testable
│       ├── config/
│       │   └── env.ts               # Typed, validated environment configuration
│       ├── types/
│       │   ├── task.ts              # Task interface, TaskStatus, DTOs
│       │   └── errors.ts            # AppError + ValidationError + NotFoundError
│       ├── repositories/
│       │   ├── ITaskRepository.ts   # Repository abstraction (the DB-swap seam)
│       │   └── taskRepository.ts    # In-memory implementation
│       ├── services/
│       │   └── taskService.ts       # Business logic; throws domain errors
│       ├── controllers/
│       │   └── taskController.ts    # Thin HTTP layer
│       ├── routes/
│       │   ├── index.ts             # Mounts /api routes
│       │   └── taskRoutes.ts        # GET/POST/PATCH/DELETE
│       ├── middleware/
│       │   ├── errorHandler.ts      # Global error → JSON envelope
│       │   ├── notFoundHandler.ts   # 404 for unmatched routes
│       │   └── requestLogger.ts     # One-line request logging
│       ├── validators/
│       │   └── taskValidators.ts    # Hand-written input validators
│       └── utils/
│           └── asyncHandler.ts      # Async route-handler wrapper
└── client/
    ├── package.json
    ├── tsconfig.json
    ├── tsconfig.node.json
    ├── vite.config.ts
    ├── index.html
    ├── .env
    └── src/
        ├── main.tsx                 # ReactDOM entry
        ├── App.tsx                  # Root layout
        ├── App.css
        ├── index.css                # Global styles / reset
        ├── types/
        │   └── task.ts              # Task type mirroring the server
        ├── services/
        │   └── taskApi.ts           # listTasks / createTask / updateTask / deleteTask
        ├── utils/
        │   └── apiClient.ts         # Fetch wrapper with consistent error mapping
        ├── hooks/
        │   └── useTasks.ts          # State + loading + error + mutations
        └── components/
            ├── TaskForm/
            ├── TaskFilters/
            ├── TaskList/
            ├── TaskItem/
            ├── LoadingSpinner/
            └── ErrorBanner/
```

---

## Setup & Run

### Prerequisites
- Node.js **18 or newer** (for `crypto.randomUUID()` support)
- npm (comes with Node)

### 1. Install dependencies
```bash
cd server
npm install

cd ../client
npm install
```

### 2. Environment files

Both `server/.env` and `client/.env` are included in the project with sensible development defaults — **no copying or editing is required to run locally**. The values are:

- `server/.env`: `PORT=3001`, `NODE_ENV=development`, `CORS_ORIGIN=http://localhost:5173`
- `client/.env`: `VITE_API_BASE_URL=http://localhost:3001`

None of these are secrets; they're dev-only configuration. Change them if your machine already has those ports in use.

### 3. Run in development
Open two terminals.

**Terminal 1 — server**:
```bash
cd server
npm run dev
# → server listening on http://localhost:3001
```

**Terminal 2 — client**:
```bash
cd client
npm run dev
# → Vite dev server on http://localhost:5173
```

The Vite dev server proxies `/api/*` requests to `http://localhost:3001`, so the client can call the API without CORS configuration in development.

---

## API Reference

Base URL (development): `http://localhost:3001`

### Endpoints

| Method | Path             | Description           | Success | Failure                  |
|--------|------------------|-----------------------|---------|--------------------------|
| GET    | `/health`        | Liveness check        | `200`   | —                        |
| GET    | `/api/tasks`     | List all tasks        | `200`   | `500`                    |
| GET    | `/api/tasks/:id` | Fetch a single task   | `200`   | `404`                    |
| POST   | `/api/tasks`     | Create a task         | `201`   | `400`                    |
| PATCH  | `/api/tasks/:id` | Partially update task | `200`   | `400`, `404`             |
| DELETE | `/api/tasks/:id` | Delete a task         | `204`   | `404`                    |

### Task shape
```json
{
  "id": "c8d4...-uuid",
  "title": "Write README",
  "description": "Polish the README before release",
  "status": "pending",
  "priority": "high",
  "createdAt": "2026-05-11T08:30:00.000Z"
}
```

### Create / update payload
```json
{
  "title": "Write README",
  "description": "Polish the README before release",
  "status": "pending",
  "priority": "high"
}
```

Validation rules (enforced server-side, mirrored client-side for fast feedback):

- `title`: **required** for POST. String, trimmed.
  - At least **3** characters after trim.
  - At most **120** characters after trim.
  - Cannot consist only of whitespace (a non-empty all-spaces string is rejected with a specific message).
- `description`: optional. String, ≤ 2000 chars. Defaults to `""`.
- `status`: optional. One of `"pending" | "in_progress" | "completed"`. Defaults to `"pending"`.
- `priority`: optional. One of `"low" | "medium" | "high"`. Defaults to `"medium"`.

For PATCH, all fields are optional but at least one must be present.

### Error envelope
Every error response shares the same shape:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "title is required"
  }
}
```

Error codes:
- `VALIDATION_ERROR` → 400
- `NOT_FOUND` → 404
- `INTERNAL_ERROR` → 500

---

## Architecture & Assumptions

This section explains the main design decisions.

### Separation of concerns (server)

Each backend layer has a single responsibility and only knows about the layer immediately below it:

```
routes → controllers → services → repository → in-memory store
                          ↑
                       validators (called by controllers)
                       errors    (thrown anywhere; caught by middleware)
```

- **Routes** wire URLs to controller methods. No logic.
- **Controllers** translate between HTTP and the service. They parse the request, call validators, invoke the service, and shape the response. They never touch storage and never set HTTP status codes for errors (errors are *thrown*).
- **Services** hold business logic. They call the repository and throw domain errors (e.g., `NotFoundError`) when invariants are violated. They are HTTP-unaware — a future GraphQL or CLI front-end could reuse them.
- **Repositories** abstract persistence. The `ITaskRepository` interface defines the contract; `InMemoryTaskRepository` is one implementation. Swapping to PostgreSQL/Mongo means writing a new class against the same interface — **no other file changes**.
- **Validators** are hand-written functions that parse raw input into typed DTOs or throw `ValidationError`. We deliberately avoided validation libraries (zod, joi) so the validation logic is **fully visible and reviewable**, with no library magic between the request and the rule.
- **Middleware** handles cross-cutting concerns: request logging, 404 fallback, and the global error handler that turns any thrown error into the consistent JSON envelope above.

### Why in-memory storage?

We chose in-memory storage to:
1. Keep setup trivial (no DB to install or configure).
2. Keep the focus on **architecture**, not ORM boilerplate.
3. Still demonstrate the Repository pattern, so a real DB is a drop-in replacement.

### Error-handling strategy

Errors flow in one direction:
1. Any layer (validator, service, repository) **throws** a typed error — never sets a status code itself.
2. Async route handlers are wrapped in `asyncHandler`, which forwards rejected promises to Express's error pipeline.
3. The global `errorHandler` middleware maps errors to HTTP responses:
   - Instances of `AppError` → use the error's own `statusCode` and `code`.
   - Anything else → log the stack server-side, respond with a generic 500 (no internals leaked to the client).

This makes the error surface **consistent and predictable**: every error response has the same envelope, and adding a new error type means subclassing `AppError` and throwing it — no middleware changes needed.

### Validation strategy

Validation lives in `validators/taskValidators.ts`. Each function:
- Receives the raw `unknown` request body.
- Type-narrows fields one at a time, throwing `ValidationError` with a field-specific message on the first failure.
- Returns a fully typed DTO on success.

This places **typed input at the controller boundary**, so every layer below the controller can assume valid data. The validator logic is intentionally simple and explicit — easy to read top-to-bottom.

### Testing

The project has no automated tests yet. The Repository pattern is built so tests can be added easily: inject a fake repository into the service, and test the routes with supertest against the app from `app.ts`, which is built without starting a server.

### Styling approach

Here's how styling was implemented and why.

**Approach: plain, hand-written CSS files co-located with their components.** No styling libraries, no preprocessors, no CSS-in-JS. Every rule that ends up in the browser is in a `.css` file you can read directly.

**Layout of the 8 CSS files:**

| File | Purpose |
|---|---|
| `src/index.css` | Global resets + base typography (loaded once via `main.tsx`) |
| `src/App.css` | Page-shell layout (header, main container, list section spacing) |
| `src/components/LoadingSpinner/LoadingSpinner.css` | Spinner + rotation keyframes |
| `src/components/ErrorBanner/ErrorBanner.css` | Red banner with icon + dismiss button |
| `src/components/TaskForm/TaskForm.css` | Form fields, inline error block, invalid-input styles |
| `src/components/TaskFilters/TaskFilters.css` | Filter bar (status + sort dropdowns) |
| `src/components/TaskList/TaskList.css` | List layout + empty-state card |
| `src/components/TaskItem/TaskItem.css` | Row layout, status-color left border, priority badge, action buttons |

Each component's `.css` is loaded by a single `import './X.css'` line at the top of its `.tsx` — Vite injects it as a `<style>` tag in dev and extracts it into a hashed bundle on build.

**Naming convention: BEM-inspired.**

```
.task-item                       ← block (the component root)
.task-item__title                ← element inside the block
.task-item--status-completed     ← state/variant modifier
.task-item__priority-badge--high ← element with a modifier
```

Every class begins with its component's name, so two components can't accidentally collide on a class without us noticing. This gets us ~95% of the isolation that CSS Modules would give without the `styles.taskItem` indirection layer.

**Why plain CSS over the alternatives**

| Alternative | Why we didn't pick it |
|---|---|
| **Tailwind / utility CSS** | Hides styling intent behind long class strings (`flex items-center gap-3 px-4 py-2 ...`). Adds a build step (PostCSS / JIT compilation) and a config file. For a project this size, semantic class names tell the story better than utilities. |
| **CSS Modules** (`*.module.css`) | Vite supports them natively, but they add the `styles.foo` indirection in JSX. Our BEM convention already prevents collisions, so the extra abstraction wouldn't pay off at this size. |
| **CSS-in-JS** (styled-components, Emotion) | Adds a runtime dependency that builds CSS strings on every render. Obscures the CSS from the browser dev-tools experience. Overkill for a static-feeling UI. |
| **Sass / SCSS** | A preprocessor toolchain for benefits (nesting, variables) that modern CSS now offers natively. |

**Accessible visual conventions used throughout:**

- **Status indicator**: left-border color on each task row (slate = pending, amber = in-progress, green = completed)
- **Priority indicator**: pill badge in the title row (red = high, amber = medium, slate = low)
- **Error states**: red banner with `role="alert"`; invalid form inputs get `aria-invalid="true"` and a red border via the CSS attribute selector
- **Loading**: rotating dot with `role="status"` + `aria-live="polite"` so screen readers announce activity without being noisy

The whole CSS surface is roughly 400 lines — small enough to read in a single sitting, structured enough that finding the rule for any visible element takes ten seconds.

### Client architecture

- **`useTasks` hook** is the single source of truth for task state, loading flags, and error messages. Components stay presentational.
- **`apiClient` utility** wraps `fetch` and normalizes errors into a single `ApiError` type, so the hook never deals with raw response objects.
- **Mutations refetch** after success — simple and obviously correct. Optimistic updates would speed up the UI but obscure the data-flow story for a code reader.
- **Errors and loading states are always rendered**: the `ErrorBanner` and `LoadingSpinner` components are wired to the hook's state, so the user always sees what's happening.
- **Filter and sort are pure UI state**: `App.tsx` owns `statusFilter` and `sortBy` and derives the visible list with `useMemo`. The server doesn't know about either — round-tripping for what a `[].filter()` can do would be wasteful. The hook stays storage-only.
- **Server validation messages display inline in `TaskForm`**, not just in the global error banner. When the server rejects a submission (e.g., "title must be at least 3 characters"), the message appears next to the inputs that caused it. The form also clears the global banner to avoid showing the same message twice.

### Product features beyond CRUD

Three product features were added without inflating scope:

1. **Priority field** (`low` | `medium` | `high`) on every task — defaulted to `medium` server-side, surfaced as a colored badge in the UI (red / amber / slate) and as a left-border color on each task row in combination with the status indicator.
2. **Filter by status** (All / To Do / In Progress / Done) and **sort by** (Newest first / Oldest first / Priority high → low / Priority low → high). Both are pure UI state, recomputed via `useMemo` whenever the underlying list, filter, or sort option changes.
3. **Strict input validation with graceful UI**: server enforces `title.length ≥ 3 after trim`, rejects whitespace-only titles with a specific message, and bounds `description` and the `priority` enum. The client mirrors these rules for fast feedback, and any server-side validation error is shown inline in the form rather than as an opaque banner.

### Assumptions
1. UI polish is intentionally minimal — just enough to make the data flow visible.
2. The same machine runs both server and client in development.
3. The server runs on port `3001` by default; the client (Vite) on port `5173`.
4. Node 18+ is available (for `crypto.randomUUID`).
5. The in-memory store starts empty on each server restart.

---

## Libraries Used

### Server runtime dependencies
| Library  | Purpose                                                 |
|----------|---------------------------------------------------------|
| express  | HTTP server and routing                                 |
| cors     | Permit cross-origin requests from the Vite dev server   |
| dotenv   | Load `.env` files into `process.env`                    |

### Server dev dependencies
| Library             | Purpose                              |
|---------------------|--------------------------------------|
| typescript          | TypeScript compiler                  |
| ts-node-dev         | Run + reload TS source in dev        |
| @types/express      | Type definitions                     |
| @types/cors         | Type definitions                     |
| @types/node         | Type definitions                     |

### Client runtime dependencies
| Library    | Purpose                       |
|------------|-------------------------------|
| react      | UI library                    |
| react-dom  | React DOM renderer            |

### Client dev dependencies
| Library             | Purpose                                |
|---------------------|----------------------------------------|
| typescript          | TypeScript compiler                    |
| vite                | Dev server + build                     |
| @vitejs/plugin-react| React Fast Refresh + JSX transform     |
| @types/react        | Type definitions                       |
| @types/react-dom    | Type definitions                       |

No validation, state-management, styling, or HTTP libraries were added — the project relies on built-in language and platform features to keep the code surface small and reviewable.
