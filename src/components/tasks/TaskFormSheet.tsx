import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import InputContainer from '@/components/ui/InputContainer';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TasksAPI } from '@/api/routes/TasksAPI';
import type { Task, ProjectMember } from '@/types';
import type { KeyedMutator } from 'swr';
import { cn } from '@/lib/utils';
import { Check, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  priority: z.enum(['low', 'medium', 'high']),
  status: z.enum(['todo', 'in_progress', 'done']),
  due_date: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const getInitials = (name?: string): string => {
  if (!name) return '??';
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string;
  task?: Task | null;
  /** All project members (owner + contributors) for the assignee picker */
  projectMembers: ProjectMember[];
  /**
   * When creating a new task, the column it should be placed in.
   * Defaults to 'todo' on the server if not provided.
   */
  initialColumnId?: string;
  mutate: KeyedMutator<{ tasks: Task[] }>;
}

const TaskFormSheet = ({
  open,
  onClose,
  projectId,
  task,
  projectMembers,
  initialColumnId,
  mutate,
}: Props) => {
  const isEdit = !!task;

  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'medium', status: 'todo' },
  });

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description ?? '',
        priority: task.priority,
        status: task.status,
        due_date: task.due_date ?? '',
      });
      setSelectedAssigneeIds(task.assignee_ids ?? []);
    } else {
      reset({
        priority: 'medium',
        status: 'todo',
        title: '',
        description: '',
        due_date: '',
      });
      setSelectedAssigneeIds([]);
    }
  }, [task, reset, open]);

  const toggleAssignee = (memberId: string) => {
    setSelectedAssigneeIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId],
    );
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (isEdit) {
        await TasksAPI.update(task.id, { ...data, assignee_ids: selectedAssigneeIds });
        toast.success('Task updated');
      } else {
        await TasksAPI.create(projectId, {
          ...data,
          assignee_ids: selectedAssigneeIds,
          column_id: initialColumnId,
        });
        toast.success('Task created');
      }
      await mutate();
      onClose();
    } catch {
      toast.error(isEdit ? 'Failed to update task' : 'Failed to create task');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto sm:border-l sm:rounded-l-2xl shadow-2xl">
        <SheetHeader className="pb-4 border-b/50">
          <SheetTitle className="text-xl font-bold tracking-tight">
            {isEdit ? 'Edit Task' : 'New Task'}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
          <Controller
            control={control}
            name="title"
            render={({ field }) => (
              <InputContainer title="Title *" error={errors.title?.message}>
                <Input {...field} id="task-title" placeholder="Task title" />
              </InputContainer>
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <InputContainer title="Description">
                <Textarea {...field} id="task-desc" placeholder="Optional description" rows={3} />
              </InputContainer>
            )}
          />

          <div className="grid grid-cols-2 gap-5">
            <Controller
              control={control}
              name="priority"
              render={({ field }) => (
                <InputContainer title="Priority">
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Priority">
                        {field.value === 'low' && 'Low'}
                        {field.value === 'medium' && 'Medium'}
                        {field.value === 'high' && 'High'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </InputContainer>
              )}
            />

            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <InputContainer title="Status">
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Status">
                        {field.value === 'todo' && 'To Do'}
                        {field.value === 'in_progress' && 'In Progress'}
                        {field.value === 'done' && 'Done'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </InputContainer>
              )}
            />
          </div>

          <Controller
            control={control}
            name="due_date"
            render={({ field }) => (
              <InputContainer title="Due Date">
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !field.value && 'text-muted-foreground',
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(new Date(field.value), 'PPP')
                        ) : (
                          <span>Pick a due date</span>
                        )}
                      </Button>
                    }
                  />
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </InputContainer>
            )}
          />

          <div className="space-y-2.5">
            <Label className="text-sm font-semibold tracking-tight text-foreground/90">
              Assignees
            </Label>

            {projectMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-4 border border-dashed flex items-center justify-center">
                No members on this project yet.
              </p>
            ) : (
              <div className="rounded-xl border shadow-sm divide-y overflow-hidden bg-card transition-all">
                {projectMembers.map((member) => {
                  const isSelected = selectedAssigneeIds.includes(member.id);

                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => toggleAssignee(member.id)}
                      className={cn(
                        'flex items-center gap-3 w-full px-4 py-3 text-sm text-left transition-all',
                        'hover:bg-accent/80',
                        isSelected
                          ? 'bg-primary/5 border-l-2 border-l-primary'
                          : 'border-l-2 border-l-transparent',
                      )}
                    >
                      <span
                        className={cn(
                          'w-5 h-5 flex items-center justify-center shrink-0 rounded-full border transition-colors',
                          isSelected
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-input bg-background',
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3 flex-shrink-0" strokeWidth={3} />}
                      </span>

                      <Avatar size="sm" className="ring-1 ring-border shadow-sm">
                        <AvatarFallback className="bg-secondary/50 font-medium">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>

                      <span className="flex-1 truncate font-medium text-foreground/90">
                        {member.name}
                      </span>

                      {member.role === 'owner' && (
                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground shrink-0 bg-muted px-2 py-0.5 rounded-full">
                          Owner
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {selectedAssigneeIds.length > 0 && (
              <p className="text-xs font-medium text-muted-foreground animate-in fade-in slide-in-from-top-1">
                {selectedAssigneeIds.length}{' '}
                {selectedAssigneeIds.length === 1 ? 'person' : 'people'} assigned
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Task'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default TaskFormSheet;
