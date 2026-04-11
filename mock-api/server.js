const jsonServer = require("json-server");
const path = require("path");
const { randomUUID } = require("crypto");

const app = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, "db.json"));
const middlewares = jsonServer.defaults({ logger: false });

// ── Middleware ────────────────────────────────────────────────────────────────

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  );
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(middlewares);
app.use(jsonServer.bodyParser);

// ── Helpers ───────────────────────────────────────────────────────────────────

const db = () => router.db;

const now = () => new Date().toISOString();

const DEFAULT_COLUMNS = [
  { id: "todo", name: "To Do", isDefault: true },
  { id: "in_progress", name: "In Progress", isDefault: true },
  { id: "done", name: "Done", isDefault: true },
];

/** Encode a minimal JWT-like token (base64 — mock only, not secure) */
const encodeToken = (userId, email) =>
  Buffer.from(JSON.stringify({ user_id: userId, email })).toString("base64");

/** Decode token from Authorization header */
const decodeToken = (req) => {
  const header = req.headers.authorization ?? "";
  if (!header.startsWith("Bearer ")) return null;
  try {
    return JSON.parse(Buffer.from(header.split(" ")[1], "base64").toString());
  } catch {
    return null;
  }
};

/** Express middleware — attaches req.currentUser or returns 401 */
const requireAuth = (req, res, next) => {
  const payload = decodeToken(req);
  if (!payload) return res.status(401).json({ error: "unauthorized" });

  const user = db().get("users").find({ id: payload.user_id }).value();
  if (!user) return res.status(401).json({ error: "unauthorized" });

  const { password: _pw, ...safeUser } = user;
  req.currentUser = safeUser;
  next();
};

const stripPassword = (user) => {
  const { password: _pw, ...rest } = user;
  return rest;
};

/** Returns true if the userId is an owner or contributor on the project */
const isProjectMember = (project, userId) =>
  project.owner_id === userId ||
  (project.contributor_ids ?? []).includes(userId);

/**
 * Normalize a task object — ensures column_id is always present.
 * Legacy tasks (created before Kanban) fall back to their status value.
 */
const normalizeTask = (task) => ({
  ...task,
  column_id: task.column_id ?? task.status ?? "todo",
});

// ── Auth ──────────────────────────────────────────────────────────────────────

app.post("/auth/register", (req, res) => {
  const { name, username, email, password } = req.body ?? {};

  const fields = {};
  if (!name) fields.name = "is required";
  if (!username) fields.username = "is required";
  if (!email) fields.email = "is required";
  if (!password) fields.password = "is required";

  if (Object.keys(fields).length) {
    return res.status(400).json({ error: "validation failed", fields });
  }

  const existingEmail = db().get("users").find({ email }).value();
  if (existingEmail) {
    return res.status(400).json({
      error: "validation failed",
      fields: { email: "already in use" },
    });
  }

  const existingUsername = db().get("users").find({ username }).value();
  if (existingUsername) {
    return res.status(400).json({
      error: "validation failed",
      fields: { username: "already in use" },
    });
  }

  const user = {
    id: randomUUID(),
    name,
    username,
    email,
    password,
    created_at: now(),
  };
  db().get("users").push(user).write();

  return res.status(201).json({
    token: encodeToken(user.id, user.email),
    user: stripPassword(user),
  });
});

app.post("/auth/login", (req, res) => {
  const { emailOrUsername, password } = req.body ?? {};

  if (!emailOrUsername || !password) {
    const fields = {};
    if (!emailOrUsername) fields.emailOrUsername = "is required";
    if (!password) fields.password = "is required";
    return res.status(400).json({ error: "validation failed", fields });
  }

  const user = db()
    .get("users")
    .find(
      (u) =>
        (u.email === emailOrUsername || u.username === emailOrUsername) &&
        u.password === password,
    )
    .value();
  if (!user) return res.status(401).json({ error: "unauthorized" });

  return res.json({
    token: encodeToken(user.id, user.email),
    user: stripPassword(user),
  });
});

app.get("/auth/me", requireAuth, (req, res) => res.json(req.currentUser));

// ── Users ─────────────────────────────────────────────────────────────────────

app.get("/users/lookup", requireAuth, (req, res) => {
  const { identifier } = req.query;

  if (!identifier) {
    return res
      .status(400)
      .json({ error: "identifier query param is required" });
  }

  const user = db()
    .get("users")
    .find(
      (u) =>
        u.email === identifier ||
        u.username === identifier ||
        u.id === identifier,
    )
    .value();
  if (!user) {
    return res.status(404).json({
      error: "no_account",
      message: "No TaskFlow account found for this identity",
    });
  }

  return res.json(stripPassword(user));
});

app.get("/users/search", requireAuth, (req, res) => {
  const { q } = req.query;

  if (!q || typeof q !== "string") {
    return res.json([]);
  }

  const query = q.toLowerCase();

  const users = db()
    .get("users")
    .filter(
      (u) =>
        u.email.toLowerCase().includes(query) ||
        (u.name && u.name.toLowerCase().includes(query)) ||
        (u.username && u.username.toLowerCase().includes(query)),
    )
    .take(5)
    .value()
    .map(stripPassword);

  return res.json(users);
});

// ── Projects ──────────────────────────────────────────────────────────────────

app.get("/projects", requireAuth, (req, res) => {
  const userId = req.currentUser.id;

  const projects = db()
    .get("projects")
    .filter(
      (p) =>
        p.owner_id === userId || (p.contributor_ids ?? []).includes(userId),
    )
    .value();

  return res.json({ projects });
});

app.post("/projects", requireAuth, (req, res) => {
  const { name, description } = req.body ?? {};

  if (!name) {
    return res.status(400).json({
      error: "validation failed",
      fields: { name: "is required" },
    });
  }

  const project = {
    id: randomUUID(),
    name,
    description: description ?? null,
    owner_id: req.currentUser.id,
    contributor_ids: [],
    columns: [...DEFAULT_COLUMNS],
    created_at: now(),
  };

  db().get("projects").push(project).write();
  return res.status(201).json(project);
});

app.get("/projects/:id", requireAuth, (req, res) => {
  const project = db().get("projects").find({ id: req.params.id }).value();
  if (!project) return res.status(404).json({ error: "not found" });

  if (!isProjectMember(project, req.currentUser.id)) {
    return res.status(403).json({ error: "forbidden" });
  }

  const tasks = db()
    .get("tasks")
    .filter({ project_id: req.params.id })
    .value()
    .map(normalizeTask);

  // Ensure project itself has columns (migration shim)
  const safeProject = {
    ...project,
    columns: project.columns ?? [...DEFAULT_COLUMNS],
  };

  return res.json({ ...safeProject, tasks });
});

app.patch("/projects/:id", requireAuth, (req, res) => {
  const project = db().get("projects").find({ id: req.params.id }).value();
  if (!project) return res.status(404).json({ error: "not found" });
  if (project.owner_id !== req.currentUser.id) {
    return res.status(403).json({ error: "forbidden" });
  }

  const { name, description } = req.body ?? {};

  db()
    .get("projects")
    .find({ id: req.params.id })
    .assign({
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
    })
    .write();

  return res.json(db().get("projects").find({ id: req.params.id }).value());
});

app.delete("/projects/:id", requireAuth, (req, res) => {
  const project = db().get("projects").find({ id: req.params.id }).value();
  if (!project) return res.status(404).json({ error: "not found" });
  if (project.owner_id !== req.currentUser.id) {
    return res.status(403).json({ error: "forbidden" });
  }

  db().get("projects").remove({ id: req.params.id }).write();
  db().get("tasks").remove({ project_id: req.params.id }).write();
  return res.sendStatus(204);
});

// ── Project Columns ───────────────────────────────────────────────────────────

/**
 * Add a custom column to a project — owner only.
 */
app.post("/projects/:id/columns", requireAuth, (req, res) => {
  const project = db().get("projects").find({ id: req.params.id }).value();
  if (!project) return res.status(404).json({ error: "not found" });

  if (project.owner_id !== req.currentUser.id) {
    return res.status(403).json({ error: "forbidden" });
  }

  const { name } = req.body ?? {};
  if (!name?.trim()) {
    return res.status(400).json({
      error: "validation failed",
      fields: { name: "is required" },
    });
  }

  const existingColumns = project.columns ?? [...DEFAULT_COLUMNS];

  const newColumn = {
    id: randomUUID(),
    name: name.trim(),
    isDefault: false,
  };

  db()
    .get("projects")
    .find({ id: req.params.id })
    .assign({ columns: [...existingColumns, newColumn] })
    .write();

  return res.status(201).json(newColumn);
});

/**
 * Delete a custom column — owner only.
 * Tasks in the deleted column are moved to 'todo'.
 */
app.delete("/projects/:id/columns/:columnId", requireAuth, (req, res) => {
  const project = db().get("projects").find({ id: req.params.id }).value();
  if (!project) return res.status(404).json({ error: "not found" });

  if (project.owner_id !== req.currentUser.id) {
    return res.status(403).json({ error: "forbidden" });
  }

  const existingColumns = project.columns ?? [...DEFAULT_COLUMNS];
  const targetColumn = existingColumns.find(
    (c) => c.id === req.params.columnId,
  );

  if (!targetColumn) {
    return res.status(404).json({ error: "column not found" });
  }

  if (targetColumn.isDefault) {
    return res.status(400).json({
      error: "cannot_delete_default",
      message: "Default columns cannot be deleted",
    });
  }

  // Move tasks in this column to 'todo'
  db()
    .get("tasks")
    .filter({ project_id: req.params.id, column_id: req.params.columnId })
    .each((task) => {
      db()
        .get("tasks")
        .find({ id: task.id })
        .assign({ column_id: "todo", updated_at: now() })
        .write();
    })
    .value();

  // Remove the column from the project
  db()
    .get("projects")
    .find({ id: req.params.id })
    .assign({
      columns: existingColumns.filter((c) => c.id !== req.params.columnId),
    })
    .write();

  return res.sendStatus(204);
});

// ── Project Members ───────────────────────────────────────────────────────────

app.get("/projects/:id/members", requireAuth, (req, res) => {
  const project = db().get("projects").find({ id: req.params.id }).value();
  if (!project) return res.status(404).json({ error: "not found" });

  if (!isProjectMember(project, req.currentUser.id)) {
    return res.status(403).json({ error: "forbidden" });
  }

  const ownerRecord = db().get("users").find({ id: project.owner_id }).value();
  const owner = ownerRecord ? stripPassword(ownerRecord) : null;

  const contributors = (project.contributor_ids ?? [])
    .map((uid) => {
      const u = db().get("users").find({ id: uid }).value();
      return u ? stripPassword(u) : null;
    })
    .filter(Boolean);

  return res.json({ owner, contributors });
});

app.post("/projects/:id/contributors", requireAuth, (req, res) => {
  const project = db().get("projects").find({ id: req.params.id }).value();
  if (!project) return res.status(404).json({ error: "not found" });

  if (project.owner_id !== req.currentUser.id) {
    return res.status(403).json({ error: "forbidden" });
  }

  const { identifier } = req.body ?? {};
  if (!identifier) {
    return res.status(400).json({
      error: "validation failed",
      fields: { identifier: "is required" },
    });
  }

  const targetUser = db()
    .get("users")
    .find(
      (u) =>
        u.email === identifier ||
        u.username === identifier ||
        u.id === identifier,
    )
    .value();
  if (!targetUser) {
    return res.status(404).json({
      error: "no_account",
      message: "No TaskFlow account found for this email",
    });
  }

  if (targetUser.id === project.owner_id) {
    return res.status(400).json({
      error: "already_owner",
      message: "This person is already the project owner",
    });
  }

  const existingContributorIds = project.contributor_ids ?? [];
  if (existingContributorIds.includes(targetUser.id)) {
    return res.status(400).json({
      error: "already_contributor",
      message: "This person is already a contributor",
    });
  }

  db()
    .get("projects")
    .find({ id: req.params.id })
    .assign({ contributor_ids: [...existingContributorIds, targetUser.id] })
    .write();

  return res.status(201).json(stripPassword(targetUser));
});

app.delete("/projects/:id/contributors/:userId", requireAuth, (req, res) => {
  const project = db().get("projects").find({ id: req.params.id }).value();
  if (!project) return res.status(404).json({ error: "not found" });

  if (project.owner_id !== req.currentUser.id) {
    return res.status(403).json({ error: "forbidden" });
  }

  const existingContributorIds = project.contributor_ids ?? [];
  if (!existingContributorIds.includes(req.params.userId)) {
    return res.status(404).json({ error: "not found" });
  }

  db()
    .get("projects")
    .find({ id: req.params.id })
    .assign({
      contributor_ids: existingContributorIds.filter(
        (id) => id !== req.params.userId,
      ),
    })
    .write();

  return res.sendStatus(204);
});

// ── Tasks ─────────────────────────────────────────────────────────────────────

app.get("/projects/:id/tasks", requireAuth, (req, res) => {
  const project = db().get("projects").find({ id: req.params.id }).value();
  if (!project) return res.status(404).json({ error: "not found" });

  if (!isProjectMember(project, req.currentUser.id)) {
    return res.status(403).json({ error: "forbidden" });
  }

  let tasks = db()
    .get("tasks")
    .filter({ project_id: req.params.id })
    .value()
    .map(normalizeTask);

  if (req.query.status) {
    tasks = tasks.filter((t) => t.status === req.query.status);
  }

  if (req.query.assignee) {
    tasks = tasks.filter((t) =>
      (t.assignee_ids ?? []).includes(req.query.assignee),
    );
  }

  return res.json({ tasks });
});

app.post("/projects/:id/tasks", requireAuth, (req, res) => {
  const project = db().get("projects").find({ id: req.params.id }).value();
  if (!project) return res.status(404).json({ error: "not found" });

  if (!isProjectMember(project, req.currentUser.id)) {
    return res.status(403).json({ error: "forbidden" });
  }

  const { title, description, priority, assignee_ids, column_id, due_date } =
    req.body ?? {};

  if (!title) {
    return res.status(400).json({
      error: "validation failed",
      fields: { title: "is required" },
    });
  }

  // Determine which column the task starts in; default to 'todo'
  const resolvedColumnId = column_id ?? "todo";

  // If the column is a default status column, sync the status field
  const defaultStatusIds = ["todo", "in_progress", "done"];
  const resolvedStatus = defaultStatusIds.includes(resolvedColumnId)
    ? resolvedColumnId
    : "todo";

  const ts = now();
  const task = {
    id: randomUUID(),
    title,
    description: description ?? null,
    status: resolvedStatus,
    priority: priority ?? "medium",
    project_id: req.params.id,
    assignee_ids: Array.isArray(assignee_ids) ? assignee_ids : [],
    column_id: resolvedColumnId,
    due_date: due_date ?? null,
    created_at: ts,
    updated_at: ts,
  };

  db().get("tasks").push(task).write();
  return res.status(201).json(task);
});

app.patch("/tasks/:id", requireAuth, (req, res) => {
  const task = db().get("tasks").find({ id: req.params.id }).value();
  if (!task) return res.status(404).json({ error: "not found" });

  const updateData = { ...req.body, updated_at: now() };

  // Guard: assignee_ids must stay an array if provided
  if (
    updateData.assignee_ids !== undefined &&
    !Array.isArray(updateData.assignee_ids)
  ) {
    updateData.assignee_ids = [];
  }

  // If column_id is being updated to a default column, sync status
  const defaultStatusIds = ["todo", "in_progress", "done"];
  if (
    updateData.column_id !== undefined &&
    defaultStatusIds.includes(updateData.column_id) &&
    updateData.status === undefined
  ) {
    updateData.status = updateData.column_id;
  }

  db().get("tasks").find({ id: req.params.id }).assign(updateData).write();

  return res.json(
    normalizeTask(db().get("tasks").find({ id: req.params.id }).value()),
  );
});

app.delete("/tasks/:id", requireAuth, (req, res) => {
  const task = db().get("tasks").find({ id: req.params.id }).value();
  if (!task) return res.status(404).json({ error: "not found" });

  db().get("tasks").remove({ id: req.params.id }).write();
  return res.sendStatus(204);
});

/** Tasks assigned to the current user across all accessible projects */
app.get("/tasks/mine", requireAuth, (req, res) => {
  const userId = req.currentUser.id;

  const accessibleProjects = db()
    .get("projects")
    .filter(
      (p) =>
        p.owner_id === userId || (p.contributor_ids ?? []).includes(userId),
    )
    .value();

  const accessibleProjectIds = new Set(accessibleProjects.map((p) => p.id));

  const projectById = Object.fromEntries(
    accessibleProjects.map((p) => [p.id, { id: p.id, name: p.name }]),
  );

  const myTasks = db()
    .get("tasks")
    .filter(
      (t) =>
        accessibleProjectIds.has(t.project_id) &&
        (t.assignee_ids ?? []).includes(userId),
    )
    .value()
    .map((task) => ({
      ...normalizeTask(task),
      project: projectById[task.project_id],
    }));

  return res.json({ tasks: myTasks });
});

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Mock API running   → http://localhost:${PORT}`);
  console.log(`Seed credentials   → test@example.com / password123`);
  console.log(`Seed contributor   → jane@example.com / password123`);
  console.log(`Your account       → mohamednafees14@gmail.com / 1234567890`);
});
