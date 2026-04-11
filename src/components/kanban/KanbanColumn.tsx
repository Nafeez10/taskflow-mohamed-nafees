import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import KanbanTaskCard from './KanbanTaskCard';
import { cn } from '@/lib/utils';
import type { ProjectColumn, Task, User } from '@/types';
import { Plus, Trash2 } from 'lucide-react';

const COLUMN_DOT: Record<string, string> = {
  todo: 'bg-muted-foreground/50',
  in_progress: 'bg-blue-400',
  done: 'bg-green-400',
};

interface Props {
  column: ProjectColumn;
  tasks: Task[];
  /** Resolved user objects keyed by user ID, used for assignee display */
  memberById: Map<string, User>;
  isOwner: boolean;
  onAddTask: (columnId: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}

const KanbanColumn = ({
  column,
  tasks,
  memberById,
  isOwner,
  onAddTask,
  onDeleteColumn,
  onEditTask,
  onDeleteTask,
}: Props) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: 'Column', column },
  });

  const dotColor = COLUMN_DOT[column.id] ?? 'bg-purple-400';

  const resolveAssignees = (assigneeIds: string[]): User[] =>
    assigneeIds.map((id) => memberById.get(id)).filter((u): u is User => u !== undefined);

  return (
    <div className="flex flex-col w-72 shrink-0 rounded-xl bg-muted/40 border">
      {/* Column header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span className={cn('h-2 w-2 rounded-full shrink-0', dotColor)} />

          <h3 className="text-sm font-semibold">{column.name}</h3>

          <Badge variant="secondary" className="text-xs h-4 px-1.5">
            {tasks.length}
          </Badge>
        </div>

        {/* Delete button — only for custom (non-default) columns, owners only */}
        {isOwner && !column.isDefault && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
            onClick={() => onDeleteColumn(column.id)}
            aria-label={`Delete "${column.name}" column`}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Droppable task area */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 flex flex-col gap-2 px-2 pb-2 min-h-24 rounded-lg transition-colors',
          isOver && 'bg-accent/60',
        )}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanTaskCard
              key={task.id}
              task={task}
              assignees={resolveAssignees(task.assignee_ids ?? [])}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
            />
          ))}
        </SortableContext>

        {/* Empty drop zone hint */}
        {tasks.length === 0 && (
          <div
            className={cn(
              'flex-1 flex items-center justify-center rounded-lg border border-dashed',
              'text-xs text-muted-foreground/50 min-h-16 transition-colors',
              isOver && 'border-primary/40 text-primary/60 bg-primary/5',
            )}
          >
            {isOver ? 'Drop here' : 'No tasks'}
          </div>
        )}
      </div>

      {/* Add task button */}
      <div className="px-2 pb-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-xs text-muted-foreground h-7 gap-1"
          onClick={() => onAddTask(column.id)}
        >
          <Plus className="h-3.5 w-3.5" />
          Add task
        </Button>
      </div>
    </div>
  );
};

export default KanbanColumn;
