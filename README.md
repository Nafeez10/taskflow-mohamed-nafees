# TaskFlow — Frontend Take-Home Submission

A minimal but real task management system built as a take-home assignment for the **Frontend Engineer** role. Users can register, log in, create and manage projects, invite collaborators, and move tasks across a Kanban board.

---

## 1. Overview

### What it does

| Feature | Details |
|---|---|
| Auth | Register / Login with JWT. Token persisted across refreshes. Protected routes redirect to `/login`. |
| Projects | Create, edit, and delete projects. View projects you own or contribute to. |
| Kanban board | Drag-and-drop tasks between columns. Add custom columns. |
| Tasks | Create, edit, and delete tasks with title, description, priority, assignee(s), and due date. |
| Collaborators | Invite team members by email. Remove contributors. |
| My Tasks | Cross-project view of all tasks assigned to you. |
| Assignee filter | Filter the Kanban board by team member. |
| Optimistic UI | Task column changes update instantly and revert on API failure. |

### Tech stack

| Layer | Choice | Version |
|---|---|---|
| Framework | React + TypeScript | 19 / 6 |
| Build tool | Vite | 8 |
| Routing | React Router | v7 |
| Data fetching | SWR | v2 |
| HTTP client | Axios | v1 |
| Forms + validation | React Hook Form + Zod | v7 / v4 |
| UI components | shadcn/ui (Base Nova preset) | latest |
| Styling | Tailwind CSS | v4 |
| Drag and drop | @dnd-kit/core | v6 |
| Icons | Lucide React | latest |
| Dates | date-fns | v4 |
| Toast | Sonner | v2 |
| Mock API | json-server 0.17.4 (custom Express server) | — |
| Container | Docker + nginx | multi-stage |

---

## 2. Architecture Decisions

### Mock API — custom json-server instead of MSW

The assignment permits `json-server`, `msw`, or any other mocking approach. I chose json-server (0.17.4) but wrote a **fully custom Express-style server** on top of it rather than using json-server's default REST behaviour.

**Why:** json-server's default routes don't model auth, ownership rules, contributor relationships, or Kanban columns. A custom server lets me implement exactly the spec — correct HTTP status codes (401 vs 403), structured validation errors, and business logic (e.g. only the project owner can delete columns; contributors can only create and update tasks).

The token format is `base64(JSON.stringify({ user_id, email }))` — intentionally insecure for a mock, but structurally identical to a real JWT claim so the frontend code doesn't need to change.

### SWR for data fetching

SWR's `mutate` is the core primitive behind optimistic UI. The pattern used throughout is:

```ts
// 1. Instantly show the new state (no revalidation)
await mutate({ tasks: optimistic }, { revalidate: false });
try {
  await TasksAPI.update(taskId, payload);
  await mutate(); // revalidate from server
} catch {
  await mutate(); // revert on failure
  toast.error('...');
}
```

This gives instant feedback with automatic rollback — without a separate state management library.

### No external state management

Only React Context is used (`AuthContext`). Everything else is colocated with the component that owns it or lifted to the nearest common ancestor. SWR's cache acts as a lightweight shared state for server data.

### API layer split by call type

All GET requests are SWR hooks (`useProjects`, `useTasks`, etc.). All mutations are plain async functions grouped in objects (`ProjectsAPI`, `TasksAPI`). This keeps components clean — they import a hook and a mutation object, nothing more.

### shadcn/ui — Base Nova preset

shadcn/ui generates unstyled-by-default components using `@base-ui/react` primitives. The Base Nova preset adds a design system (colours, radius, shadows) without coupling to a heavy component framework like MUI. Every component is source code in `src/components/ui/` — fully owned, never a black box.

### Kanban columns as first-class data

Rather than hardcoding `todo / in_progress / done`, each project stores an ordered `columns` array. The three default columns are always present and cannot be deleted. Owners can add custom columns (e.g. "Review", "Blocked"). Tasks carry a `column_id` field; the three default columns also keep `status` in sync for backward compatibility.

### Docker — two services, no database

Since this is a frontend-only submission there is no PostgreSQL. `docker-compose.yml` runs:
- **mock-api** — Node 20 + json-server server; data lives in `db.json` baked into the image
- **frontend** — multi-stage build (Node 20 builds → nginx serves the static dist)

`VITE_API_URL` is baked in at build time (Vite replaces it at bundle time, not runtime). The browser talks directly to the mock-api on `localhost:4000`, so there is no nginx proxy needed — the URL is just the host machine's port.

### Tradeoffs made

| Decision | Tradeoff |
|---|---|
| Single-bundle build | Fast to ship; bundle is ~670 KB (uncompressed). Route-level code splitting with `React.lazy` would cut initial load significantly. |
| `db.json` baked into image | Data resets on every rebuild. Acceptable for a review environment; a real app would mount a volume or use a real database. |
| No tests | No unit or integration tests were written in the interest of time. The mock API server is the most test-worthy file. |
| Base64 mock token | Simple to decode for mock purposes; nothing about the auth flow assumes this format except the mock server itself. |

---

## 3. Running Locally

### Prerequisites

- **Docker Desktop** — must be installed and **running** before executing any `docker` command.
  - Windows / Mac: open Docker Desktop from the Start menu / Applications and wait for the whale icon to show "Docker Desktop is running".
  - Linux: `sudo systemctl start docker`

No other tools needed. Node.js, npm, and everything else run inside containers.

### Docker

```bash
git clone https://github.com/<your-name>/taskflow-frontend
cd taskflow-frontend
docker compose up
```

That's it. Docker Compose will build the images on first run automatically — no flags needed.

| Service | URL |
|---|---|
| React app | http://localhost:3000 |
| Mock API | http://localhost:4000 |

> **If you change source files** and want the container to pick them up, run `docker compose up --build` to force a rebuild.

**Optional — change ports.** Create a `.env` file (or copy from `.env.example`):

```env
APP_PORT=8080   # React app → http://localhost:8080
API_PORT=5000   # Mock API  → http://localhost:5000
```

No `.env` file is required — the defaults (`3000` / `4000`) work out of the box.

### Local dev — two terminals

If you prefer to run without Docker:

```bash
# Terminal 1 — mock API
npm install
npm run mock
# → http://localhost:4000

# Terminal 2 — React dev server
npm run dev
# → http://localhost:5173
```

Make sure `.env` has `VITE_API_URL=http://localhost:4000` (it does by default).

---

## 4. Running Migrations

**Not applicable.** This is a frontend-only submission. There is no database. The mock API stores data in `mock-api/db.json`, which ships with seed data already in place.

If you want to reset to the original seed data:

```bash
git checkout mock-api/db.json
```

Or just rebuild the Docker image:

```bash
docker compose up --build
```

---

## 5. Test Credentials

Two seed users are available immediately after startup — no registration required.

| Name | Email | Password | Role |
|---|---|---|---|
| Test User | `test@example.com` | `password123` | Owner of "Sample Project" |
| Jane Smith | `jane@example.com` | `password123` | Contributor on "Sample Project" |

The seed project has three tasks across the three default columns. You can register additional accounts and invite them by email from the "Manage Members" panel on any project you own.

---

## 6. API Reference

All endpoints require `Authorization: Bearer <token>` except the two auth routes. All responses are `application/json`.

### Auth

**POST `/auth/register`**

```json
// Request
{ "name": "Jane Doe", "email": "jane@example.com", "password": "secret123" }

// 201 Response
{ "token": "<base64-mock-token>", "user": { "id": "uuid", "name": "Jane Doe", "email": "jane@example.com", "created_at": "..." } }

// 400 — email already in use
{ "error": "validation failed", "fields": { "email": "already in use" } }
```

**POST `/auth/login`**

```json
// Request
{ "email": "jane@example.com", "password": "secret123" }

// 200 Response
{ "token": "<base64-mock-token>", "user": { "id": "uuid", "name": "Jane Doe", "email": "jane@example.com" } }

// 401 — wrong credentials
{ "error": "unauthorized" }
```

**GET `/auth/me`**

```json
// 200 Response
{ "id": "uuid", "name": "Jane Doe", "email": "jane@example.com", "created_at": "..." }
```

---

### Users

**GET `/users/lookup?email=jane@example.com`**

Used by the Create Project dialog and Contributor Manager to validate an email before adding.

```json
// 200 Response
{ "id": "uuid", "name": "Jane Doe", "email": "jane@example.com" }

// 404 — no account with that email
{ "error": "no_account", "message": "No TaskFlow account found for this email" }
```

---

### Projects

**GET `/projects`**

Returns all projects the current user owns or contributes to.

```json
// 200 Response
{
  "projects": [
    {
      "id": "uuid",
      "name": "Website Redesign",
      "description": "Q2 project",
      "owner_id": "uuid",
      "contributor_ids": ["uuid"],
      "columns": [
        { "id": "todo", "name": "To Do", "isDefault": true },
        { "id": "in_progress", "name": "In Progress", "isDefault": true },
        { "id": "done", "name": "Done", "isDefault": true }
      ],
      "created_at": "2026-04-01T10:00:00Z"
    }
  ]
}
```

**POST `/projects`**

```json
// Request
{ "name": "New Project", "description": "Optional description" }

// 201 Response — full project object with default columns
```

**GET `/projects/:id`**

Returns the project plus all its tasks. Returns `403` if the current user is not the owner or a contributor.

```json
// 200 Response
{
  "id": "uuid",
  "name": "Website Redesign",
  "owner_id": "uuid",
  "contributor_ids": ["uuid"],
  "columns": [ /* ... */ ],
  "tasks": [ /* task objects */ ],
  "created_at": "..."
}
```

**PATCH `/projects/:id`** — owner only

```json
// Request (all fields optional)
{ "name": "Updated Name", "description": "Updated description" }

// 200 Response — updated project object
// 403 — not the owner
```

**DELETE `/projects/:id`** — owner only

```
// 204 No Content
// Also deletes all tasks belonging to the project
```

---

### Project Members

**GET `/projects/:id/members`**

```json
// 200 Response
{
  "owner": { "id": "uuid", "name": "Test User", "email": "test@example.com" },
  "contributors": [
    { "id": "uuid", "name": "Jane Smith", "email": "jane@example.com" }
  ]
}
```

**POST `/projects/:id/contributors`** — owner only

Adds a user by email address.

```json
// Request
{ "email": "colleague@example.com" }

// 201 Response — the added user object
// 400 — already a contributor: { "error": "already_contributor", "message": "..." }
// 404 — no account:            { "error": "no_account", "message": "..." }
```

**DELETE `/projects/:id/contributors/:userId`** — owner only

```
// 204 No Content
```

---

### Kanban Columns

**POST `/projects/:id/columns`** — owner only

```json
// Request
{ "name": "Review" }

// 201 Response
{ "id": "uuid", "name": "Review", "isDefault": false }
```

**DELETE `/projects/:id/columns/:columnId`** — owner only

Cannot delete default columns (`todo`, `in_progress`, `done`). Tasks in the deleted column are moved to `todo`.

```
// 204 No Content
// 400 — { "error": "cannot_delete_default", "message": "..." }
```

---

### Tasks

**GET `/projects/:id/tasks`**

Supports optional query filters:

| Param | Example | Effect |
|---|---|---|
| `?status=` | `?status=todo` | Filter by `todo`, `in_progress`, or `done` |
| `?assignee=` | `?assignee=<userId>` | Tasks where that user is in `assignee_ids` |

```json
// 200 Response
{
  "tasks": [
    {
      "id": "uuid",
      "title": "Design homepage",
      "description": "...",
      "status": "in_progress",
      "priority": "high",
      "project_id": "uuid",
      "assignee_ids": ["uuid"],
      "column_id": "in_progress",
      "due_date": "2026-04-15",
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

**POST `/projects/:id/tasks`**

```json
// Request
{
  "title": "Design homepage",
  "description": "Optional",
  "priority": "high",
  "assignee_ids": ["uuid"],
  "column_id": "todo",
  "due_date": "2026-04-15"
}

// 201 Response — created task object
```

**PATCH `/tasks/:id`** — any project member

All fields are optional.

```json
// Request
{
  "title": "Updated title",
  "description": "Updated",
  "status": "done",
  "priority": "low",
  "assignee_ids": ["uuid"],
  "column_id": "done",
  "due_date": "2026-04-20"
}

// 200 Response — updated task object
```

**DELETE `/tasks/:id`** — any project member

```
// 204 No Content
```

**GET `/tasks/mine`**

Returns all tasks assigned to the currently authenticated user across all projects they have access to. Used by the "My Tasks" page.

```json
// 200 Response
{
  "tasks": [
    {
      /* ...all task fields... */
      "project": { "id": "uuid", "name": "Website Redesign" }
    }
  ]
}
```

---

### Error Responses

| Status | Body |
|---|---|
| `400` | `{ "error": "validation failed", "fields": { "field": "message" } }` |
| `401` | `{ "error": "unauthorized" }` |
| `403` | `{ "error": "forbidden" }` |
| `404` | `{ "error": "not found" }` |

---

## 7. What You'd Do With More Time

### Code splitting

The production bundle is ~670 KB uncompressed. All routes are eagerly loaded. Wrapping each page in `React.lazy()` and `<Suspense>` would cut initial load time significantly, especially for users who only visit the Projects page.

### Tests

No automated tests were written. The highest-value targets would be:

- **Mock API server** — integration tests for auth (register/login/me), project CRUD, and contributor management. The business logic lives here and is the most failure-prone surface.
- **Optimistic UI** — unit tests for the SWR mutate/revert pattern in the Kanban board drag handler.
- **Form validation** — Zod schema tests are fast and catch edge cases before they reach the UI.

### Dark mode

`next-themes` is already installed as a dependency (pulled in by shadcn during init) and the Tailwind config supports dark mode classes. A toggle in the Navbar that writes to localStorage and flips the `dark` class on `<html>` would take roughly 30 minutes to complete.

### Mobile Kanban experience

The Kanban board scrolls horizontally on mobile, which works but isn't great. A better mobile experience would collapse the board into a tabbed view — one column visible at a time, swipeable. The data model doesn't need to change; only the layout component would differ.

### Real-time updates

The mock API is stateless from the browser's perspective — two users working on the same project won't see each other's changes without a refresh. Adding a WebSocket or SSE channel to push task mutations would require a real backend. On the frontend, the `mutate` call from SWR would be triggered on each incoming event.

### Pagination

The `/projects` and `/projects/:id/tasks` endpoints return everything in one response. At scale, both need `?page=&limit=` support. The SWR fetcher key already encodes query params, so adding pagination parameters is straightforward — the main work is UI (a "Load more" button or infinite scroll).

### Shortcuts taken

- **`db.json` as the database** — data resets on every `docker compose up --build`. Good enough for a review, not for production.
- **`window.confirm` replaced with a dialog** — done. Originally used browser `confirm()` for destructive actions; replaced with a proper `ConfirmDialog` component in the final version.
- **Assignee is multi-select** — the assignment spec shows a single `assignee_id`. The mock API and data model store `assignee_ids` (array) because the UI naturally supports multi-assign and it's a one-way upgrade. The filter still works by checking if a given user ID is in the array.
