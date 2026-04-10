# TaskFlow Frontend — Project Context

> This file exists as a context fallback for AI sessions. It captures the full picture of what was built, why, and how.

---

## Assignment Summary

Zomato take-home for a **Frontend Engineer** role. Build a minimal task management system with auth, projects, and tasks against a mock API.

**Requirements:**
- React + TypeScript
- Login / Register with JWT auth persisted across refreshes
- Projects list page
- Project detail page with tasks (filter by status)
- Task create/edit via side panel
- Navbar with user name + logout
- Loading / error / empty states on every view
- Optimistic UI for task status changes
- Responsive at 375px and 1280px
- `docker compose up` must work with zero manual steps
- Mock API via json-server

---

## Tech Stack

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
| Icons | Lucide React | latest |
| Dates | date-fns | v4 |
| Toast | Sonner | v2 |
| Mock API | json-server (custom server) | 0.17.4 |
| Container | Docker + nginx | multi-stage |

---

## Key Conventions

- **Arrow functions everywhere** — `const X = () => ...` for all components, hooks, and utilities. No `function` declarations.
- **No external state management** — React Context API only (`src/context/`)
- **`StorageKeys` enum** — all localStorage keys go through `src/enum/StorageKeys.ts`. Never use raw strings.
- **API split by type:**
  - Mutations → `const XAPI = { method: fn }` (called imperatively)
  - GETs → `export const useX = () => useSWR(...)` (SWR hooks)

---

## Folder Structure

```
taskflow-frontend/
├── mock-api/
│   ├── server.js          ← Full custom API server built on json-server
│   ├── db.json            ← Seed data (1 user, 1 project, 3 tasks)
│   └── package.json
├── src/
│   ├── api/
│   │   ├── axios/
│   │   │   └── instance.ts          ← Axios + auth/401 interceptors
│   │   └── routes/
│   │       ├── AuthAPI.ts           ← AuthAPI{login,register} + useCurrentUser
│   │       ├── ProjectsAPI.ts       ← ProjectsAPI{create,update,delete} + useProjects/useProject
│   │       └── TasksAPI.ts          ← TasksAPI{create,update,delete} + useTasks
│   ├── components/
│   │   ├── auth/ProtectedRoute.tsx
│   │   ├── layout/Navbar.tsx
│   │   ├── projects/
│   │   │   ├── ProjectCard.tsx
│   │   │   └── CreateProjectDialog.tsx
│   │   ├── tasks/
│   │   │   ├── TaskCard.tsx           ← Inline status buttons (optimistic update)
│   │   │   ├── TaskFilters.tsx
│   │   │   └── TaskFormSheet.tsx      ← Create + edit in one Sheet
│   │   └── ui/                        ← shadcn generated components
│   ├── context/
│   │   └── AuthContext.tsx            ← user + token state, persisted via StorageKeys
│   ├── enum/
│   │   └── StorageKeys.ts             ← enum StorageKeys { TOKEN, USER }
│   ├── features/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── projects/
│   │   │   └── ProjectsPage.tsx
│   │   └── project-detail/
│   │       └── ProjectDetailPage.tsx
│   ├── lib/utils.ts                   ← shadcn cn() utility
│   ├── types/index.ts                 ← User, Project, Task, AuthResponse, ApiError
│   └── utils/date.ts                  ← formatDate, formatRelative, isOverdue
├── .dockerignore
├── .env.example
├── Dockerfile                         ← Multi-stage: Node 20 build → nginx serve
├── Dockerfile.mock                    ← Node 20 running json-server
├── docker-compose.yml
└── nginx.conf                         ← SPA fallback + cache headers
```

---

## Auth Flow

1. `AuthContext` initialises from `localStorage` (via `StorageKeys`) on mount
2. `login(token, user)` writes both to localStorage + React state
3. `logout()` clears both
4. Axios request interceptor reads `StorageKeys.TOKEN` → injects `Authorization: Bearer`
5. Axios response interceptor: 401 → clear storage → redirect `/login`
6. `ProtectedRoute` uses `isAuthenticated` from context → renders `<Outlet />` or `<Navigate to="/login" />`

---

## Optimistic UI (task status)

`ProjectDetailPage.tsx` — `handleStatusChange`:

```ts
// 1. Instantly update the UI
await mutate({ tasks: optimistic }, { revalidate: false })
try {
  // 2. Persist to API
  await TasksAPI.update(task.id, { status })
  await mutate()           // revalidate
} catch {
  await mutate()           // revert on failure
  toast.error('...')
}
```

---

## Mock API

`mock-api/server.js` is a fully hand-rolled server using json-server's Express instance and lowdb.
Implements every endpoint from the assignment spec:

| Method | Endpoint |
|---|---|
| POST | `/auth/register` |
| POST | `/auth/login` |
| GET | `/auth/me` |
| GET/POST | `/projects` |
| GET/PATCH/DELETE | `/projects/:id` |
| GET/POST | `/projects/:id/tasks` |
| PATCH/DELETE | `/tasks/:id` |

Token format: `base64(JSON.stringify({ user_id, email }))` — mock only.
Data lives in `db.json`, baked into the Docker image (resets on rebuild).

---

## Running the Project

### Docker (recommended)
```bash
cp .env.example .env
docker compose up --build

# App  → http://localhost:3000
# API  → http://localhost:4000
```

### Local dev (two terminals)
```bash
# Terminal 1 — mock API
npm run mock        # → http://localhost:4000

# Terminal 2 — React
npm run dev         # → http://localhost:5173
```

### Seed credentials
```
Email:    test@example.com
Password: password123
```

---

## Config Fixes Log

| File | Fix | Reason |
|---|---|---|
| `tsconfig.app.json` | Removed `erasableSyntaxOnly` | Blocked regular `enum` declarations |
| `tsconfig.app.json` | Added `ignoreDeprecations: "6.0"` | TS6 deprecated `baseUrl` |
| `tsconfig.app.json` | Fixed missing comma | JSON parse error |
| `tsconfig.json` (root) | Added `compilerOptions.paths` | shadcn couldn't find `@/` alias |
| `vite.config.ts` | Added `@tailwindcss/vite` + `resolve.alias` | Tailwind v4 + path alias setup |
| `src/index.css` | Replaced with Tailwind v4 format | shadcn init overwrote with Nova preset |
| `Dockerfile` | `npm ci` → `npm install` | Lockfile out of sync after adding json-server |
| `Dockerfile.mock` | `npm ci` → `npm install` | No lockfile in mock-api/ |
| `.dockerignore` | Added | `node_modules` was sending 273MB build context |
| `Navbar.tsx` | Removed `asChild` from trigger | Not supported by Base Nova preset |

---

## What's Left / Could Be Improved

- Code splitting — bundle is 666KB, lazy-load routes with `React.lazy`
- `<textarea>` for description fields instead of `<Input>`
- Assignee filter needs a users list endpoint in mock API
- Edit/delete project from ProjectDetailPage
- Confirm dialog instead of `window.confirm`
- Dark mode toggle (bonus)
- Drag-and-drop task reordering (bonus)
