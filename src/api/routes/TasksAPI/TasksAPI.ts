import useSWR from 'swr';
import axiosInstance from '@/api/axios/axiosInstance';
import { swrFetcher } from '@/api/swrFetcher';
import { StorageKeys } from '@/enum/StorageKeys';
import type { Task } from '@/types';
import type {
  CreateTaskPayload,
  UpdateTaskPayload,
  TaskFilterPayload,
  TaskListResponse,
  MyTaskListResponse,
} from './types';

// ── Mutations (called imperatively) ──────────────────────────────────────────

export const TasksAPI = {
  create: (projectId: string, data: CreateTaskPayload) =>
    axiosInstance
      .post<Task>(`/projects/${projectId}/tasks`, data)
      .then((r) => r.data),

  update: (taskId: string, data: UpdateTaskPayload) =>
    axiosInstance.patch<Task>(`/tasks/${taskId}`, data).then((r) => r.data),

  delete: (taskId: string) =>
    axiosInstance.delete(`/tasks/${taskId}`).then((r) => r.data),
};

// ── SWR hooks (GET) ───────────────────────────────────────────────────────────



export const useTasks = (
  projectId: string | undefined,
  filters?: TaskFilterPayload,
) => {
  const params = new URLSearchParams();
  if (filters?.assignee) params.set('assignee', filters.assignee);
  const qs = params.toString();

  const key = projectId
    ? `/projects/${projectId}/tasks${qs ? `?${qs}` : ''}`
    : null;

  const { data, error, isLoading, mutate } = useSWR<TaskListResponse>(
    key,
    swrFetcher,
  );

  return {
    tasks: data?.tasks ?? [],
    error,
    isLoading,
    mutate,
  };
};

/** Returns all tasks assigned to the current user across every project */
export const useMyTasks = () => {
  const token = localStorage.getItem(StorageKeys.TOKEN);

  const { data, error, isLoading, mutate } = useSWR<MyTaskListResponse>(
    token ? '/tasks/mine' : null,
    swrFetcher,
  );

  return {
    tasks: data?.tasks ?? [],
    error,
    isLoading,
    mutate,
  };
};

export type {
  CreateTaskPayload,
  UpdateTaskPayload,
  TaskFilterPayload,
  TaskListResponse,
  MyTaskListResponse,
};
