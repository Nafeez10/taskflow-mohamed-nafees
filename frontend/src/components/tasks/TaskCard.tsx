import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar';
import { formatDate, isOverdue } from '@/utils/date';
import { cn } from '@/lib/utils';
import type { Task, User } from '@/types';
import { Pencil, Trash2, Calendar } from 'lucide-react';

import { TASK_STATUS_STYLES, TASK_PRIORITY_STYLES } from '@/constants/tasks';
import { getInitials } from '@/utils/user';

const MAX_VISIBLE_AVATARS = 3;

interface Props {
  task: Task;
  /** Resolved user objects for each ID in task.assignee_ids */
  assignees: User[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

const TaskCard = ({ task, assignees, onEdit, onDelete }: Props) => {
  const overdue = isOverdue(task.due_date) && task.status !== 'done';

  const visibleAssignees = assignees.slice(0, MAX_VISIBLE_AVATARS);
  const overflowCount = assignees.length - MAX_VISIBLE_AVATARS;

  return (
    <div className="bg-card border rounded-lg p-4 space-y-3 hover:shadow-sm transition-shadow">
      {/* Header — title + action buttons */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-sm leading-snug">{task.title}</h3>

        <div className="flex shrink-0 gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onEdit(task)}
            aria-label="Edit task"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={() => onDelete(task)}
            aria-label="Delete task"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
      )}

      {/* Status + priority badges */}
      <div className="flex flex-wrap gap-1.5">
        <span
          className={cn(
            'text-xs px-2 py-0.5 rounded-full font-medium',
            TASK_STATUS_STYLES[task.status] || 'bg-muted text-muted-foreground',
          )}
        >
          {task.status_name || (task.status.charAt(0).toUpperCase() + task.status.slice(1))}
        </span>
        <span
          className={cn(
            'text-xs px-2 py-0.5 rounded-full font-medium capitalize',
            TASK_PRIORITY_STYLES[task.priority],
          )}
        >
          {task.priority}
        </span>
      </div>

      {/* Due date */}
      {task.due_date && (
        <div
          className={cn(
            'flex items-center gap-1 text-xs',
            overdue ? 'text-destructive font-medium' : 'text-muted-foreground',
          )}
        >
          <Calendar className="h-3 w-3" />
          {overdue ? 'Overdue · ' : ''}
          {formatDate(task.due_date)}
        </div>
      )}

      {/* Assignee avatars */}
      {assignees.length > 0 && (
        <div className="flex items-center gap-2">
          <AvatarGroup>
            {visibleAssignees.map((user) => (
              <Avatar key={user.id} size="sm">
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
            ))}
            {overflowCount > 0 && (
              <AvatarGroupCount className="text-xs">+{overflowCount}</AvatarGroupCount>
            )}
          </AvatarGroup>

          <span className="text-xs text-muted-foreground">
            {assignees.length === 1 ? assignees[0].name : `${assignees.length} assignees`}
          </span>
        </div>
      )}

    </div>
  );
};

export default TaskCard;
