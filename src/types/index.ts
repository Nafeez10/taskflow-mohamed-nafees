export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  created_at?: string;
}

/** A project member — either the owner or a contributor */
export interface ProjectMember extends User {
  role: 'owner' | 'contributor';
}

/** A column in the Kanban board */
export interface ProjectColumn {
  id: string;
  name: string;
  /** True for the three built-in columns (todo / in_progress / done) */
  isDefault: boolean;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  contributor_ids: string[];
  columns: ProjectColumn[];
  created_at: string;
  tasks?: Task[];
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  project_id: string;
  assignee_ids: string[];
  /** Kanban column this task currently lives in */
  column_id: string;
  due_date?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Task returned by GET /tasks/mine — includes a minimal project object
 * so the My Tasks page can group and link tasks by project.
 */
export interface TaskWithProject extends Task {
  project: {
    id: string;
    name: string;
  };
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  error: string;
  message?: string;
  fields?: Record<string, string>;
}
