import type { User } from '@/types';

export interface CreateProjectPayload {
  name: string;
  description?: string;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
}

export interface AddContributorPayload {
  identifier: string;
}

export interface AddColumnPayload {
  name: string;
}

export interface ProjectMembersResponse {
  owner: User;
  contributors: User[];
}

export interface ProjectListResponse {
  projects: import('@/types').Project[];
}
