import { Link } from 'react-router-dom';
import { useMyTasks } from '@/api/routes/TasksAPI';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/layout/Navbar';
import { Badge } from '@/components/ui/badge';
import { formatDate, isOverdue } from '@/utils/date';
import { cn } from '@/lib/utils';
import type { TaskWithProject } from '@/types';
import { ClipboardList, Calendar, ExternalLink } from 'lucide-react';

import { TASK_STATUS_STYLES, TASK_PRIORITY_STYLES } from '@/constants/tasks';

const MyTasksSkeleton = () => (
  <div className="space-y-6">
    {Array.from({ length: 2 }).map((_, i) => (
      <div key={i} className="space-y-3">
        <div className="h-4 bg-muted animate-pulse rounded w-40" />
        {Array.from({ length: 3 }).map((_, j) => (
          <div key={j} className="border rounded-lg p-4 space-y-2">
            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
            <div className="flex gap-2">
              <div className="h-5 bg-muted animate-pulse rounded-full w-16" />
              <div className="h-5 bg-muted animate-pulse rounded-full w-12" />
            </div>
          </div>
        ))}
      </div>
    ))}
  </div>
);

const TaskRow = ({ task }: { task: TaskWithProject }) => {
  const overdue = isOverdue(task.due_date) && task.status !== 'done';

  return (
    <div className="bg-card border rounded-lg p-4 space-y-2 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-sm leading-snug">{task.title}</p>

        <Link
          to={`/projects/${task.project.id}`}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          title={`Open ${task.project.name}`}
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={cn(
            'text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider',
            TASK_STATUS_STYLES[task.status] || 'bg-muted text-muted-foreground',
          )}
        >
          {task.status_name || (task.status.charAt(0).toUpperCase() + task.status.slice(1))}
        </span>

        <span
          className={cn(
            'text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider',
            TASK_PRIORITY_STYLES[task.priority],
          )}
        >
          {task.priority}
        </span>

        {task.due_date && (
          <span
            className={cn(
              'flex items-center gap-1 text-xs',
              overdue ? 'text-destructive font-medium' : 'text-muted-foreground',
            )}
          >
            <Calendar className="h-3 w-3" />
            {overdue ? 'Overdue · ' : ''}
            {formatDate(task.due_date)}
          </span>
        )}
      </div>
    </div>
  );
};

const MyTasksPage = () => {
  const { user } = useAuth();
  const { tasks, isLoading, error } = useMyTasks();

  const tasksByProject = tasks.reduce<Record<string, TaskWithProject[]>>((groups, task) => {
    const key = task.project.id;
    if (!groups[key]) groups[key] = [];
    groups[key].push(task);
    return groups;
  }, {});

  const projectGroups = Object.values(tasksByProject);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">My Tasks</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Tasks assigned to {user?.name ?? 'you'} across all projects
          </p>
        </div>

        {isLoading && <MyTasksSkeleton />}

        {error && !isLoading && (
          <div className="text-center py-12 text-destructive text-sm">
            Failed to load tasks. Please refresh and try again.
          </div>
        )}

        {!isLoading && !error && tasks.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No tasks assigned to you</p>
            <p className="text-sm mt-1">
              When a teammate assigns a task to you, it will appear here.
            </p>
          </div>
        )}

        {!isLoading && !error && projectGroups.length > 0 && (
          <div className="space-y-8">
            {projectGroups.map((groupTasks) => {
              const project = groupTasks[0].project;

              const openCount = groupTasks.filter((t) => t.status !== 'done').length;

              return (
                <section key={project.id}>
                  <div className="flex items-center gap-2 mb-3">
                    <Link
                      to={`/projects/${project.id}`}
                      className="text-sm font-semibold hover:underline underline-offset-2"
                    >
                      {project.name}
                    </Link>

                    <Badge variant="secondary" className="text-xs">
                      {openCount} open
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {groupTasks.map((task) => (
                      <TaskRow key={task.id} task={task} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyTasksPage;
