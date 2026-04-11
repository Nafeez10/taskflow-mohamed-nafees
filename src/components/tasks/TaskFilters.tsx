import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TaskFilterPayload as Filters } from '@/api/routes/TasksAPI';
import type { ProjectMember } from '@/types';

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
  /** All project members — used to populate the assignee dropdown */
  members?: ProjectMember[];
  /** The current user's ID — powers the "Assigned to me" shortcut */
  currentUserId?: string;
}

const TaskFilters = ({ filters, onChange, members = [], currentUserId }: Props) => {
  if (members.length === 0) return null;

  const safeUserId = currentUserId ? String(currentUserId) : undefined;

  return (
    <div className="flex flex-wrap gap-2">
      <Select
        value={filters.assignee ? String(filters.assignee) : 'all'}
        onValueChange={(v) => onChange({ ...filters, assignee: v === 'all' ? undefined : v })}
      >
        <SelectTrigger className="w-40 h-8 text-xs">
          <SelectValue placeholder="All assignees">
            {(() => {
              const val = filters.assignee ? String(filters.assignee) : 'all';
              if (val === 'all') return 'All assignees';
              if (safeUserId && val === safeUserId) return 'Assigned to me';
              const matchedMember = members.find((m) => String(m.id) === val);
              return matchedMember ? matchedMember.name : 'All assignees';
            })()}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All assignees</SelectItem>

          {safeUserId && <SelectItem value={safeUserId}>Assigned to me</SelectItem>}

          {members
            .filter((m) => String(m.id) !== safeUserId)
            .map((member) => (
              <SelectItem key={member.id} value={String(member.id)}>
                {member.name}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TaskFilters;
