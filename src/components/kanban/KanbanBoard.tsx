import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn';
import KanbanTaskCard from './KanbanTaskCard';
import TaskFormSheet from '@/components/tasks/TaskFormSheet';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { TasksAPI } from '@/api/routes/TasksAPI';
import { ProjectsAPI } from '@/api/routes/ProjectsAPI';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Task, ProjectColumn, ProjectMember, User } from '@/types';
import type { KeyedMutator } from 'swr';
import { Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
  projectId: string;
  columns: ProjectColumn[];
  tasks: Task[];
  projectMembers: ProjectMember[];
  isOwner: boolean;
  mutateTasks: KeyedMutator<{ tasks: Task[] }>;
  /** Called after a column is added or deleted so the parent can refetch the project */
  onColumnsChange: () => void;
}

const KanbanBoard = ({
  projectId,
  columns,
  tasks,
  projectMembers,
  isOwner,
  mutateTasks,
  onColumnsChange,
}: Props) => {
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);

  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalTasks(tasks);
    }
  }, [tasks]);

  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const [sheetState, setSheetState] = useState<{
    open: boolean;
    columnId: string;
    editTask: Task | null;
  }>({ open: false, columnId: 'todo', editTask: null });

  const openAddTask = (columnId: string) => setSheetState({ open: true, columnId, editTask: null });

  const openEditTask = (task: Task) =>
    setSheetState({ open: true, columnId: task.column_id, editTask: task });

  const closeSheet = () => setSheetState((prev) => ({ ...prev, open: false, editTask: null }));

  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    description?: string;
    onConfirm: () => void;
  }>({ open: false, title: '', onConfirm: () => {} });

  const closeConfirm = () => setConfirmState((prev) => ({ ...prev, open: false }));

  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [isCreatingColumn, setIsCreatingColumn] = useState(false);

  const memberById = useMemo<Map<string, User>>(
    () => new Map(projectMembers.map((m) => [m.id, m])),
    [projectMembers],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }, // prevent accidental drags on click
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 6 },
    }),
  );

  const handleDragStart = ({ active }: DragStartEvent) => {
    isDraggingRef.current = true;
    const task = localTasks.find((t) => t.id === active.id);
    setActiveTask(task ?? null);
  };

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === 'Task';
    const isOverTask = over.data.current?.type === 'Task';
    const isOverColumn = over.data.current?.type === 'Column';

    if (!isActiveTask) return;

    setLocalTasks((prev) => {
      const activeIndex = prev.findIndex((t) => t.id === activeId);
      if (activeIndex === -1) return prev;
      const activeTask = prev[activeIndex];

      if (isOverTask) {
        const overIndex = prev.findIndex((t) => t.id === overId);
        if (overIndex === -1) return prev;
        const overTask = prev[overIndex];

        if (activeTask.column_id !== overTask.column_id) {
          const next = [...prev];
          next[activeIndex] = { ...activeTask, column_id: overTask.column_id };
          return arrayMove(next, activeIndex, overIndex);
        }
        return arrayMove(prev, activeIndex, overIndex);
      }

      if (isOverColumn) {
        if (activeTask.column_id !== overId) {
          const next = [...prev];
          next[activeIndex] = { ...activeTask, column_id: overId };
          return next;
        }
      }
      return prev;
    });
  };

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    isDraggingRef.current = false;
    setActiveTask(null);

    if (!over) {
      setLocalTasks(tasks);
      return;
    }

    const taskId = String(active.id);
    const finalTaskLocal = localTasks.find((t) => t.id === taskId);
    const originalTask = tasks.find((t) => t.id === taskId);

    if (!finalTaskLocal || !originalTask) {
      setLocalTasks(tasks);
      return;
    }

    const finalColumnId = finalTaskLocal.column_id ?? 'todo';

    if (originalTask.column_id === finalColumnId) {
      setLocalTasks(tasks);
      return;
    }

    const defaultStatuses = new Set(['todo', 'in_progress', 'done']);
    const updatePayload = defaultStatuses.has(finalColumnId)
      ? { column_id: finalColumnId, status: finalColumnId as Task['status'] }
      : { column_id: finalColumnId };

    const optimistic = tasks.map((t) => (t.id === taskId ? { ...t, ...updatePayload } : t));
    setLocalTasks(optimistic);
    await mutateTasks({ tasks: optimistic }, { revalidate: false });

    try {
      await TasksAPI.update(taskId, updatePayload);
      await mutateTasks();
    } catch {
      await mutateTasks();
      toast.error('Failed to move task');
    }
  };

  const handleDeleteTask = (task: Task) => {
    setConfirmState({
      open: true,
      title: `Delete "${task.title}"?`,
      description: 'This action cannot be undone.',
      onConfirm: async () => {
        closeConfirm();
        try {
          await TasksAPI.delete(task.id);
          await mutateTasks();
          toast.success('Task deleted');
        } catch {
          toast.error('Failed to delete task');
        }
      },
    });
  };

  const handleAddColumn = async () => {
    const name = newColumnName.trim();
    if (!name) return;

    setIsCreatingColumn(true);
    try {
      await ProjectsAPI.addColumn(projectId, { name });
      onColumnsChange();
      setNewColumnName('');
      setAddingColumn(false);
      toast.success(`"${name}" column added`);
    } catch {
      toast.error('Failed to add column');
    } finally {
      setIsCreatingColumn(false);
    }
  };

  const handleDeleteColumn = (columnId: string) => {
    const column = columns.find((c) => c.id === columnId);
    if (!column) return;

    setConfirmState({
      open: true,
      title: `Delete "${column.name}"?`,
      description: 'Tasks in this column will be moved to To Do.',
      onConfirm: async () => {
        closeConfirm();
        try {
          await ProjectsAPI.deleteColumn(projectId, columnId);
          onColumnsChange();
          await mutateTasks();
          toast.success(`"${column.name}" deleted`);
        } catch {
          toast.error('Failed to delete column');
        }
      },
    });
  };

  const handleNewColumnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAddColumn();
    if (e.key === 'Escape') {
      setAddingColumn(false);
      setNewColumnName('');
    }
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 items-start">
          {columns.map((column) => {
            const columnTasks = localTasks.filter((t) => (t.column_id ?? t.status) === column.id);

            return (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={columnTasks}
                memberById={memberById}
                isOwner={isOwner}
                onAddTask={openAddTask}
                onDeleteColumn={handleDeleteColumn}
                onEditTask={openEditTask}
                onDeleteTask={handleDeleteTask}
              />
            );
          })}

          {isOwner && (
            <div className="shrink-0 w-72">
              {addingColumn ? (
                <div className="rounded-xl border bg-muted/40 p-3 space-y-2">
                  <Input
                    autoFocus
                    placeholder="Column name…"
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    onKeyDown={handleNewColumnKeyDown}
                    disabled={isCreatingColumn}
                    className="h-8 text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 h-7 text-xs"
                      disabled={!newColumnName.trim() || isCreatingColumn}
                      onClick={handleAddColumn}
                    >
                      {isCreatingColumn ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Add'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setAddingColumn(false);
                        setNewColumnName('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingColumn(true)}
                  className={cn(
                    'flex items-center gap-2 w-full rounded-xl border border-dashed',
                    'px-4 py-3 text-sm text-muted-foreground',
                    'hover:bg-muted/40 hover:text-foreground hover:border-border',
                    'transition-colors',
                  )}
                >
                  <Plus className="h-4 w-4" />
                  New Column
                </button>
              )}
            </div>
          )}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <KanbanTaskCard
              task={activeTask}
              assignees={(activeTask.assignee_ids ?? [])
                .map((id) => memberById.get(id))
                .filter((u): u is User => u !== undefined)}
              onEdit={() => {}}
              onDelete={() => {}}
              isDragOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskFormSheet
        open={sheetState.open}
        onClose={closeSheet}
        projectId={projectId}
        task={sheetState.editTask}
        projectMembers={projectMembers}
        initialColumnId={sheetState.columnId}
        mutate={mutateTasks}
      />

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        description={confirmState.description}
        confirmLabel="Delete"
        destructive
        onConfirm={confirmState.onConfirm}
        onCancel={closeConfirm}
      />
    </>
  );
};

export default KanbanBoard;
