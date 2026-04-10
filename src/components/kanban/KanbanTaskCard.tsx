import type { CSSProperties } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar';
import { formatDate, isOverdue } from '@/utils/date';
import { cn } from '@/lib/utils';
import type { Task, User } from '@/types';
import { Pencil, Trash2, Calendar, GripVertical } from 'lucide-react';

// ── Style maps ────────────────────────────────────────────────────────────────

const PRIORITY_STYLES: Record<Task['priority'], string> = {
  low:    'bg-muted text-muted-foreground',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  high:   'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};


// ── Helpers ───────────────────────────────────────────────────────────────────

const getInitials = (name?: string): string => {
  if (!name) return '??';
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const MAX_VISIBLE_AVATARS = 2;

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  task: Task;
  assignees: User[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  /** When true, the card is rendered inside DragOverlay — drag behavior is disabled */
  isDragOverlay?: boolean;
}

const KanbanTaskCard = ({
  task,
  assignees,
  onEdit,
  onDelete,
  isDragOverlay = false,
}: Props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: 'Task', task },
    disabled: isDragOverlay,
  });

  const overdue = isOverdue(task.due_date) && task.status !== 'done';

  const visibleAssignees = assignees.slice(0, MAX_VISIBLE_AVATARS);
  const overflowCount    = assignees.length - MAX_VISIBLE_AVATARS;

  const style: CSSProperties | undefined = isDragOverlay ? undefined : {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-card border rounded-lg p-3 space-y-2 group',
        'hover:shadow-sm transition-shadow',
        isDragOverlay && 'shadow-lg rotate-1 cursor-grabbing',
        isDragging   && 'cursor-grabbing',
      )}
    >
      {/* Header row: drag handle + title + actions */}
      <div className="flex items-start gap-1.5">
        {/* Drag handle */}
        <button
          {...listeners}
          {...attributes}
          className={cn(
            'mt-0.5 shrink-0 text-muted-foreground/40 hover:text-muted-foreground',
            'cursor-grab active:cursor-grabbing transition-colors',
            'opacity-0 group-hover:opacity-100',
          )}
          aria-label="Drag to move"
          tabIndex={-1}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>

        {/* Title */}
        <p onClick={() => onEdit(task)} className="flex-1 cursor-pointer text-sm font-medium leading-snug hover:underline">{task.title}</p>

        {/* Action buttons — visible on hover */}
        <div className="flex shrink-0 gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={() => onEdit(task)}
            aria-label="Edit task"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-destructive hover:text-destructive"
            onClick={() => onDelete(task)}
            aria-label="Delete task"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 pl-5">
          {task.description}
        </p>
      )}

      {/* Badges + metadata row */}
      <div className="flex items-center justify-between gap-2 pl-5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Priority badge */}
          <span
            className={cn(
              'text-xs px-1.5 py-0.5 rounded-full font-medium capitalize',
              PRIORITY_STYLES[task.priority],
            )}
          >
            {task.priority}
          </span>

          {/* Due date */}
          {task.due_date && (
            <span
              className={cn(
                'flex items-center gap-0.5 text-xs',
                overdue ? 'text-destructive font-medium' : 'text-muted-foreground',
              )}
            >
              <Calendar className="h-3 w-3" />
              {overdue ? 'Overdue' : formatDate(task.due_date)}
            </span>
          )}
        </div>

        {/* Assignee avatars */}
        {assignees.length > 0 && (
          <AvatarGroup className="shrink-0">
            {visibleAssignees.map((user) => (
              <Avatar key={user.id} size="sm">
                <AvatarFallback className="text-xs">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
            ))}
            {overflowCount > 0 && (
              <AvatarGroupCount className="text-xs">
                +{overflowCount}
              </AvatarGroupCount>
            )}
          </AvatarGroup>
        )}
      </div>
    </div>
  );
};

export default KanbanTaskCard;
