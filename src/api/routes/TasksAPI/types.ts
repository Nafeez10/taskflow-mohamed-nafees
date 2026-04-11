import type { TaskPriority, TaskStatus } from '@/types';

export interface CreateTaskPayload {
  title: string;
  description?: string;
  priority?: TaskPriority;
  assignee_ids?: string[];
  column_id?: string;
  due_date?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_ids?: string[];
  column_id?: string;
  due_date?: string | null;
}

export interface TaskFilterPayload {
  assignee?: string | null;
}

export interface TaskListResponse {
  tasks: import('@/types').Task[];
}

export interface MyTaskListResponse {
  tasks: import('@/types').TaskWithProject[];
}
