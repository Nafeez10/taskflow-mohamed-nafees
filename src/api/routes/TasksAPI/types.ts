import type { TaskPriority, TaskStatus } from '@/types';

// ── Payload Types (sent to API) ───────────────────────────────────────────────

export interface CreateTaskPayload {
  title: string;
  description?: string;
  priority?: TaskPriority;
  assignee_ids?: string[];
  /** Kanban column to place the task in; defaults to 'todo' on the server */
  column_id?: string;
  due_date?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_ids?: string[];
  /** Moving a task to a new Kanban column */
  column_id?: string;
  due_date?: string | null;
}

export interface TaskFilterPayload {
  /** Filter by a user ID — returns tasks where that user is in assignee_ids */
  assignee?: string | null;
}

// ── Response Types (received from API) ───────────────────────────────────────

export interface TaskListResponse {
  tasks: import('@/types').Task[];
}

export interface MyTaskListResponse {
  tasks: import('@/types').TaskWithProject[];
}
