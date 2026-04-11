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
*(To stop the containers, run `docker compose down`)*

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
The application is currently communicating with the Mock API (running natively on port 4000 outside of docker, or routed internally via docker container).

- **`GET /users`** 
  - Retrieves all users.
  - *Response example:* `[{ "id": "test-user-1", "name": "Test User", "email": "test@example.com" }]`
- **`GET /projects`** 
  - Retrieves all available projects.
  - *Response example:* `[{ "id": "project-seed-1", "name": "Sample Project", "columns": [...] }]`
- **`POST /projects`** 
  - Creates a new project map.
  - *Request example:* `{ "name": "New Project", "description": "About this project" }`
- **`GET /tasks?project_id={id}`**
  - Fetch all tasks relative to a single project workspace.
  - *Response example:* `[{ "id": "task-seed-1", "title": "Establish Dark Mode", "status": "todo" }]`
- **`POST /tasks`**
  - Creates a new task.
  - *Request example:* `{ "title": "Buy groceries", "project_id": "project-seed-1", "status": "todo" }`
- **`PATCH /tasks/{id}`**
  - Updates individual task information, typically used for Kanban drag-and-drop actions to change statuses.
  - *Request example:* `{ "status": "in_progress" }`

## 7. What You'd Do With More Time
- **Real Backend / Database:** I would migrate from the json-server mock API to a robust backend infrastructure (e.g., Node.js/Express with PostgreSQL) to enforce data integrity, advanced authentications, and relational dependencies properly.
- **Global Error Boundary and Toast Overhaul:** Handle failed API responses more gracefully with retry logic embedded deep into SWR, surfaced to the user seamlessly.
- **End-to-End Testing (E2E):** Introduce a testing suite like Cypress or Playwright to simulate specific user journeys, particularly the drag-and-drop feature which can be fragile without visually anchored tests. 
- **Optimistic Updates:** Apply stronger optimistic UI patterns correctly inside the Kanban board so that dropping a card reacts instantaneously to visually reflect local state regardless of server latency, before synchronizing perfectly.
