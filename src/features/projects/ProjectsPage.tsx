import { useState } from 'react';
import { Button }         from '@/components/ui/button';
import { useProjects }    from '@/api/routes/ProjectsAPI';
import { useAuth }        from '@/context/AuthContext';
import ProjectCard        from '@/components/projects/ProjectCard';
import CreateProjectDialog from '@/components/projects/CreateProjectDialog';
import Navbar             from '@/components/layout/Navbar';
import { Plus, FolderOpen } from 'lucide-react';

// ── Skeleton ──────────────────────────────────────────────────────────────────

const ProjectsSkeleton = () => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="border rounded-lg p-6 space-y-3">
        <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
        <div className="h-3 bg-muted animate-pulse rounded w-full" />
        <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
      </div>
    ))}
  </div>
);

// ── Component ─────────────────────────────────────────────────────────────────

const ProjectsPage = () => {
  const [createOpen, setCreateOpen] = useState(false);

  const { projects, isLoading, error, mutate } = useProjects();
  const { user } = useAuth();

  const ownedProjects       = projects.filter((p) => p.owner_id === user?.id);
  const contributedProjects = projects.filter((p) => p.owner_id !== user?.id);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Projects</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage your projects and tasks
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New Project
          </Button>
        </div>

        {isLoading && <ProjectsSkeleton />}

        {error && !isLoading && (
          <div className="text-center py-12 text-destructive text-sm">
            Failed to load projects. Please refresh and try again.
          </div>
        )}

        {!isLoading && !error && projects.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No projects yet</p>
            <p className="text-sm mt-1">Create your first project to get started.</p>
            <Button className="mt-4" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              New Project
            </Button>
          </div>
        )}

        {!isLoading && !error && projects.length > 0 && (
          <div className="space-y-8">

            {/* Owned projects */}
            {ownedProjects.length > 0 && (
              <section>
                {contributedProjects.length > 0 && (
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    My Projects
                  </h2>
                )}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {ownedProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      isContributor={false}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Contributed projects */}
            {contributedProjects.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Contributing To
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {contributedProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      isContributor={true}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      <CreateProjectDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        mutate={mutate}
      />
    </div>
  );
};

export default ProjectsPage;
