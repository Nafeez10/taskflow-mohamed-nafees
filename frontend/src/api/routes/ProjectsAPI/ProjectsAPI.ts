import useSWR from 'swr';
import axiosInstance from '@/api/axios/axiosInstance';
import { swrFetcher } from '@/api/swrFetcher';
import type { Project, ProjectColumn, ProjectMember, User } from '@/types';
import type {
  CreateProjectPayload,
  UpdateProjectPayload,
  AddContributorPayload,
  AddColumnPayload,
  ProjectMembersResponse,
  ProjectListResponse,
} from './types';

export const ProjectsAPI = {
  create: (data: CreateProjectPayload) =>
    axiosInstance.post<Project>('/projects', data).then((response) => response.data),

  update: (id: string, data: UpdateProjectPayload) =>
    axiosInstance.patch<Project>(`/projects/${id}`, data).then((response) => response.data),

  delete: (id: string) => axiosInstance.delete(`/projects/${id}`).then((response) => response.data),

  addContributor: (projectId: string, payload: AddContributorPayload) =>
    axiosInstance
      .post<User>(`/projects/${projectId}/contributors`, payload)
      .then((response) => response.data),

  removeContributor: (projectId: string, userId: string) =>
    axiosInstance
      .delete(`/projects/${projectId}/contributors/${userId}`)
      .then((response) => response.data),

  addColumn: (projectId: string, payload: AddColumnPayload) =>
    axiosInstance
      .post<ProjectColumn>(`/projects/${projectId}/columns`, payload)
      .then((response) => response.data),

  deleteColumn: (projectId: string, columnId: string) =>
    axiosInstance
      .delete(`/projects/${projectId}/columns/${columnId}`)
      .then((response) => response.data),
};

export const useProjects = () => {
  const { data, error, isLoading, mutate } = useSWR<ProjectListResponse>('/projects', swrFetcher);
  return {
    projects: data?.projects ?? [],
    error,
    isLoading,
    mutate,
  };
};

export const useProject = (id: string | undefined) => {
  const { data, error, isLoading, mutate } = useSWR<Project>(
    id ? `/projects/${id}` : null,
    swrFetcher,
  );
  return { project: data ?? null, error, isLoading, mutate };
};

export const useProjectMembers = (projectId: string | undefined) => {
  const { data, error, isLoading, mutate } = useSWR<ProjectMembersResponse>(
    projectId ? `/projects/${projectId}/members` : null,
    swrFetcher,
  );

  const owner: ProjectMember | null = data?.owner ? { ...data.owner, role: 'owner' } : null;

  const contributors: ProjectMember[] = (data?.contributors ?? []).map((user) => ({
    ...user,
    role: 'contributor',
  }));

  const allMembers: ProjectMember[] = owner ? [owner, ...contributors] : contributors;

  return { owner, contributors, allMembers, error, isLoading, mutate };
};

export type {
  CreateProjectPayload,
  UpdateProjectPayload,
  AddContributorPayload,
  AddColumnPayload,
  ProjectMembersResponse,
  ProjectListResponse,
};
