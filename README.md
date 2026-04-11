# TaskFlow Frontend

## 1. Overview

TaskFlow is a modern, responsive Kanban board based task management application. It allows users to track their assignments, drag and drop their workflow states, create new projects, and securely manage their tasks.

**Tech Stack:**

- **Framework:** React 19 + Vite + TypeScript
- **Styling:** Tailwind CSS V4 + shadcn/ui + Radix UI Primitives (with class-variance-authority, clsx, tailwind-merge)
- **Data Fetching:** SWR for React Hooks-based data fetching and caching
- **Forms & Validation:** react-hook-form + Zod
- **Drag & Drop:** @dnd-kit/core & @dnd-kit/sortable for Kanban board
- **Mock Backend:** json-server for rapid prototyping

## 2. Architecture Decisions

- **Feature-Based Structure:** The source code is organized primarily by feature (`src/features/`, `src/components/`, `src/api/`) instead of by file type. This keeps related code bundled closely, scaling better as the application complexity grows compared to traditional MVC-style component dumping.
- **SWR for Data Fetching:** We chose SWR instead of Redux or raw `useEffect` fetches for simplified hook-based state, automatic caching, revalidation, and optimistic UI updates without the heavy boilerplate of traditional state management.
- **Tailwind + shadcn/ui:** Offers excellent unstyled primitives that are fully accessible via Radix UI, but natively themed to our CSS variables to quickly build out robust, good-looking components without custom CSS compilation rules.
- **Mock-API / json-server:** In lieu of a real backend, a `json-server` powers persistence for this frontend challenge.
- **Omissions:** Real-time WebSockets to update Kanban states globally and real JWT authentication. Since we are using a mock backend, full tokenized security and live server push via WebSockets were intentionally left out to prioritize UX and core state management flows for the frontend review.

## 3. Running Locally

You have two options to run this project: using Native NPM or Docker Compose.

### Option 1: Docker Compose

If you have Docker Desktop installed, you can spin up the entire cluster in one command:

```bash
# This builds and runs both the mock-api and the frontend.
docker compose up -d
```

**The app will be available at: http://localhost:3000**
_(To stop the containers, run `docker compose down`)_

### Option 2: Native NPM

Requires **Node.js (v18+)** installed. You will need to start the mock database and frontend separately.

1. Install all dependencies:

   ```bash
   npm install
   ```

2. **Terminal 1 (Mock API Engine):**
   Starts the simulated backend database.

   ```bash
   npm run mock
   ```

3. **Terminal 2 (Frontend Client):**
   Starts the Vite application server.
   ```bash
   npm run dev
   ```
   **The app will be available at: http://localhost:5173**

---

## 4. Running Migrations

Because the backend is powered by `json-server` for mock responses, there are no SQL migrations to run. Data persistence is handled via the initialized `mock-api/db.json` file. The server automatically serves these populated seeds on startup.

## 5. Test Credentials

You can log in immediately using the following credentials without registering:

- **Email:** `test@example.com`
- **Password:** `password123`

## 6. API Reference

The mock API runs on **port 4000** locally (`npm run mock`) or is routed internally via Docker. All endpoints except Auth (`/auth/login`, `/auth/register`) require a **Bearer token** in the `Authorization` header.

> **Authentication:** Tokens are base64-encoded JSON payloads (mock-only, not real JWTs). Obtain one via the login or register endpoints and pass it as `Authorization: Bearer <token>`.

---

### Auth

#### `POST /auth/register`

Create a new account.

```
Request:  { "name": "John", "username": "john", "email": "john@example.com", "password": "secret" }
Response: { "token": "eyJ...", "user": { "id": "uuid", "name": "John", "username": "john", "email": "john@example.com" } }
```

Errors: `400` if validation fails (missing fields, duplicate email/username).

#### `POST /auth/login`

Log in with email/username and password.

```
Request:  { "emailOrUsername": "test@example.com", "password": "password123" }
Response: { "token": "eyJ...", "user": { "id": "test-user-1", "name": "Mohamed Nafees", "email": "test@example.com" } }
```

Errors: `401` if credentials are invalid.

#### `GET /auth/me`

Get the currently authenticated user's profile.

```
Response: { "id": "test-user-1", "name": "Mohamed Nafees", "email": "test@example.com" }
```

---

### Users

#### `GET /users/lookup?identifier={email|username|id}`

Look up a single user by email, username, or ID.

```
Response: { "id": "u2", "name": "Sarah Chen", "email": "sarah@zomato.dummy" }
```

Errors: `404` if no account found.

#### `GET /users/search?q={query}`

Search users by name, email, or username (max 5 results). Used for adding contributors.

```
Response: [{ "id": "u2", "name": "Sarah Chen", "email": "sarah@zomato.dummy" }, ...]
```

---

### Projects

#### `GET /projects`

List all projects where the current user is an owner or contributor.

```
Response: { "projects": [{ "id": "p1", "name": "Rider App", "description": "...", "owner_id": "test-user-1", "contributor_ids": ["u2", "u3"], "columns": [...] }, ...] }
```

#### `POST /projects`

Create a new project. The authenticated user becomes the owner.

```
Request:  { "name": "New Project", "description": "Optional description" }
Response: { "id": "uuid", "name": "New Project", "description": "...", "owner_id": "test-user-1", "contributor_ids": [], "columns": [{ "id": "todo", ... }, { "id": "in_progress", ... }, { "id": "done", ... }] }
```

#### `GET /projects/:id`

Get project details including all its tasks. Requires membership.

```
Response: { "id": "p1", "name": "Rider App", "owner_id": "test-user-1", "contributor_ids": [...], "columns": [...], "tasks": [{ "id": "t1-01", "title": "...", "column_id": "in_progress", ... }, ...] }
```

Errors: `403` if not a member, `404` if not found.

#### `PATCH /projects/:id`

Update project name or description. Owner only.

```
Request:  { "name": "Updated Name", "description": "Updated desc" }
Response: { "id": "p1", "name": "Updated Name", ... }
```

#### `DELETE /projects/:id`

Delete a project and all its tasks. Owner only. Returns `204 No Content`.

---

### Project Columns

#### `POST /projects/:id/columns`

Add a custom Kanban column. Owner only.

```
Request:  { "name": "QA Review" }
Response: { "id": "uuid", "name": "QA Review", "isDefault": false }
```

#### `DELETE /projects/:id/columns/:columnId`

Delete a custom column. Owner only. Tasks in the deleted column are moved to `todo`. Default columns (`todo`, `in_progress`, `done`) cannot be deleted. Returns `204 No Content`.

---

### Project Members

#### `GET /projects/:id/members`

List the owner and all contributors with full user profiles. Requires membership.

```
Response: { "owner": { "id": "test-user-1", "name": "Mohamed Nafees", ... }, "contributors": [{ "id": "u2", "name": "Sarah Chen", ... }, ...] }
```

#### `POST /projects/:id/contributors`

Add a contributor by email, username, or user ID. Owner only.

```
Request:  { "identifier": "sarah@zomato.dummy" }
Response: { "id": "u2", "name": "Sarah Chen", "email": "sarah@zomato.dummy" }
```

Errors: `400` if already a contributor/owner, `404` if user not found.

#### `DELETE /projects/:id/contributors/:userId`

Remove a contributor. Owner only. Returns `204 No Content`.

---

### Tasks

#### `GET /projects/:id/tasks`

List all tasks for a project. Supports optional query filters.

```
Query params: ?status=todo  |  ?assignee=test-user-1
Response:     { "tasks": [{ "id": "t1-01", "title": "...", "status": "todo", "priority": "high", "column_id": "todo", "assignee_ids": [...], "due_date": "2026-04-20", ... }, ...] }
```

#### `POST /projects/:id/tasks`

Create a new task within a project. Requires membership.

```
Request:  { "title": "Build login page", "description": "Optional", "priority": "high", "assignee_ids": ["u2", "u3"], "column_id": "todo", "due_date": "2026-04-20" }
Response: { "id": "uuid", "title": "Build login page", "status": "todo", "priority": "high", "project_id": "p1", "column_id": "todo", "assignee_ids": ["u2", "u3"], "due_date": "2026-04-20", "created_at": "...", "updated_at": "..." }
```

#### `PATCH /tasks/:id`

Update any task fields — used for Kanban drag-and-drop, editing details, reassigning, etc. When `column_id` is set to a default column (`todo`, `in_progress`, `done`), the `status` field is auto-synced.

```
Request:  { "column_id": "in_progress" }
Response: { "id": "t1-01", "title": "...", "status": "in_progress", "column_id": "in_progress", ... }
```

#### `DELETE /tasks/:id`

Delete a task. Returns `204 No Content`.

#### `GET /tasks/mine`

Get all tasks assigned to the current user across all accessible projects, enriched with project info.

```
Response: { "tasks": [{ "id": "t1-01", "title": "...", "column_id": "in_progress", "project": { "id": "p1", "name": "Rider App" }, ... }, ...] }
```

## 7. What You'd Do With More Time

- **Real Backend / Database:** I would migrate from the json-server mock API to a robust backend infrastructure (e.g., Node.js/Express with PostgreSQL) to enforce data integrity, advanced authentications, and relational dependencies properly.
- **Global Error Boundary and Toast Overhaul:** Handle failed API responses more gracefully with retry logic embedded deep into SWR, surfaced to the user seamlessly.
- **End-to-End Testing (E2E):** Introduce a testing suite like Cypress or Playwright to simulate specific user journeys, particularly the drag-and-drop feature which can be fragile without visually anchored tests.
- **Optimistic Updates:** Apply stronger optimistic UI patterns correctly inside the Kanban board so that dropping a card reacts instantaneously to visually reflect local state regardless of server latency, before synchronizing perfectly.
