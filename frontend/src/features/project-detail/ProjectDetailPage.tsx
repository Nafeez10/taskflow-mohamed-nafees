import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useProject, useProjectMembers, ProjectsAPI } from '@/api/routes/ProjectsAPI';
import { useTasks } from '@/api/routes/TasksAPI';
import { useAuth } from '@/context/AuthContext';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import TaskFilters from '@/components/tasks/TaskFilters';
import ContributorManager from '@/components/projects/ContributorManager';
import EditProjectDialog from '@/components/projects/EditProjectDialog';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import Navbar from '@/components/layout/Navbar';
import type { TaskFilterPayload as Filters } from '@/api/routes/TasksAPI';
import { getInitials } from '@/utils/user';
import { ChevronLeft, Users, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const MAX_HEADER_AVATARS = 4;

const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [filters, setFilters] = useState<Filters>({});
  const [contributorManagerOpen, setContributorManagerOpen] = useState(false);
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);

  const handleDeleteProject = async () => {
    try {
      await ProjectsAPI.delete(id!);
      toast.success('Project deleted');
      navigate('/projects');
    } catch {
      toast.error('Failed to delete project');
    }
  };

  const {
    project,
    isLoading: projectLoading,
    error: projectError,
    mutate: mutateProject,
  } = useProject(id);

  const { allMembers, isLoading: membersLoading, mutate: refreshMembers } = useProjectMembers(id);

  const {
    tasks,
    isLoading: tasksLoading,
    error: tasksError,
    mutate: mutateTasks,
  } = useTasks(id, filters);

  const isOwner = project?.owner_id === user?.id;

  const columns = project?.columns ?? [];
  const visibleMembers = allMembers.slice(0, MAX_HEADER_AVATARS);
  const overflowCount = allMembers.length - MAX_HEADER_AVATARS;

  if (projectError) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center text-destructive">
          Project not found.{' '}
          <button onClick={() => navigate('/projects')} className="underline">
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            to="/projects"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
          >
            <ChevronLeft className="h-4 w-4" />
            Projects
          </Link>

          {projectLoading ? (
            <div className="space-y-2">
              <div className="h-7 bg-muted animate-pulse rounded w-48" />
              <div className="h-4 bg-muted animate-pulse rounded w-72" />
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{project?.name}</h1>

                {isOwner && (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center justify-center h-7 w-7 rounded-md hover:bg-accent transition-colors outline-none text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Project options</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => setEditProjectOpen(true)}>
                        <Pencil className="h-3.5 w-3.5 mr-2" />
                        Edit Project
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteProjectOpen(true)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Delete Project
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {project?.description && (
                <p className="text-muted-foreground text-sm mt-1">{project.description}</p>
              )}

              {!membersLoading && (
                <div className="flex items-center gap-3 mt-3">
                  {allMembers.length > 0 && (
                    <AvatarGroup>
                      {visibleMembers.map((member) => (
                        <Avatar key={member.id} size="sm">
                          <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                        </Avatar>
                      ))}
                      {overflowCount > 0 && (
                        <AvatarGroupCount className="size-6 text-xs">
                          +{overflowCount}
                        </AvatarGroupCount>
                      )}
                    </AvatarGroup>
                  )}

                  {allMembers.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {allMembers.length} {allMembers.length === 1 ? 'member' : 'members'}
                    </span>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 gap-1"
                    onClick={() => setContributorManagerOpen(true)}
                  >
                    <Users className="h-3 w-3" />
                    {isOwner
                      ? allMembers.length > 0
                        ? 'Manage Members'
                        : 'Add Members'
                      : 'View Members'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {allMembers.length > 0 && (
          <div className="flex items-center gap-3 mb-4">
            <TaskFilters
              filters={filters}
              onChange={setFilters}
              members={allMembers}
              currentUserId={user?.id}
            />
          </div>
        )}

        {(projectLoading || tasksLoading) && (
          <div className="flex gap-4 overflow-x-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-72 shrink-0 rounded-xl bg-muted/40 border p-3 space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
                {Array.from({ length: 2 }).map((_, j) => (
                  <div key={j} className="rounded-lg border bg-card p-3 space-y-2">
                    <div className="h-3 bg-muted animate-pulse rounded w-3/4" />
                    <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {tasksError && !tasksLoading && (
          <p className="text-center py-12 text-destructive text-sm">Failed to load tasks.</p>
        )}

        {!projectLoading && !tasksLoading && !tasksError && columns.length > 0 && (
          <KanbanBoard
            projectId={id!}
            columns={columns}
            tasks={tasks}
            projectMembers={allMembers}
            isOwner={isOwner}
            mutateTasks={mutateTasks}
            onColumnsChange={mutateProject}
          />
        )}
      </main>

      <ContributorManager
        open={contributorManagerOpen}
        onClose={() => setContributorManagerOpen(false)}
        projectId={id!}
        isOwner={isOwner}
        allMembers={allMembers}
        onMembersChange={refreshMembers}
      />

      {project && (
        <EditProjectDialog
          open={editProjectOpen}
          onClose={() => setEditProjectOpen(false)}
          project={project}
          onUpdated={mutateProject}
        />
      )}

      <ConfirmDialog
        open={deleteProjectOpen}
        title="Delete project?"
        description="This will permanently delete the project and all its tasks. This action cannot be undone."
        confirmLabel="Delete Project"
        destructive
        onConfirm={handleDeleteProject}
        onCancel={() => setDeleteProjectOpen(false)}
      />
    </div>
  );
};

export default ProjectDetailPage;
