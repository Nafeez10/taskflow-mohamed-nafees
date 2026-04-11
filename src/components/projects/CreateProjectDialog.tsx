import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputContainer from '@/components/ui/InputContainer';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ProjectsAPI } from '@/api/routes/ProjectsAPI';
import { UsersAPI } from '@/api/routes/UsersAPI';
import ContributorSearch from '@/components/projects/ContributorSearch';
import type { KeyedMutator } from 'swr';
import type { Project, User } from '@/types';
import { X, UserPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
});

type FormData = z.infer<typeof schema>;

const extractErrorMessage = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as { response?: { data?: { message?: string } } }).response?.data;
    return data?.message ?? fallback;
  }
  return fallback;
};

type Props = {
  open: boolean;
  onClose: () => void;
  mutate: KeyedMutator<{ projects: Project[] }>;
};

const CreateProjectDialog = ({ open, onClose, mutate }: Props) => {
  const [serverError, setServerError] = useState('');

  // Pending contributors — validated against the API before submission
  const [pendingContributors, setPendingContributors] = useState<User[]>([]);
  const [contributorEmail, setContributorEmail] = useState('');
  const [contributorError, setContributorError] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const handleAddPendingContributor = async (identifier: string) => {
    if (!identifier) return;

    setContributorError('');
    setIsLookingUp(true);

    try {
      const user = await UsersAPI.lookup(identifier);

      if (pendingContributors.some((c) => c.id === user.id)) {
        setContributorError('Already added to this project');
        return;
      }

      setPendingContributors((prev) => [...prev, user]);
      setContributorEmail('');
    } catch (err) {
      setContributorError(extractErrorMessage(err, 'No TaskFlow account found for this identity'));
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleRemovePendingContributor = (userId: string) => {
    setPendingContributors((prev) => prev.filter((c) => c.id !== userId));
  };

  const onSubmit = async (data: FormData) => {
    setServerError('');

    try {
      const project = await ProjectsAPI.create(data);

      // Attempt to add all pending contributors; track any failures
      const failedEmails: string[] = [];
      for (const contributor of pendingContributors) {
        try {
          await ProjectsAPI.addContributor(project.id, {
            identifier: contributor.username || contributor.email,
          });
        } catch {
          failedEmails.push(contributor.email);
        }
      }

      await mutate();

      if (failedEmails.length > 0) {
        toast.warning(`Project created, but failed to add: ${failedEmails.join(', ')}`);
      } else {
        toast.success('Project created');
      }

      handleClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setServerError(msg);
    }
  };

  const handleClose = () => {
    reset();
    setServerError('');
    setPendingContributors([]);
    setContributorEmail('');
    setContributorError('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <InputContainer title="Name *" error={errors.name?.message}>
                <Input {...field} id="proj-name" placeholder="My Project" />
              </InputContainer>
            )}
          />

          {/* Description */}
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <InputContainer title="Description">
                <Textarea {...field} id="proj-desc" placeholder="Optional description" rows={3} />
              </InputContainer>
            )}
          />

          <Separator />

          {/* Contributors */}
          <div className="space-y-2">
            <Label>Add Contributors</Label>
            <p className="text-xs text-muted-foreground">
              Invite teammates by their TaskFlow email address.
            </p>

            {/* Pending contributors chips */}
            {pendingContributors.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {pendingContributors.map((contributor) => (
                  <Badge
                    key={contributor.id}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1"
                  >
                    {contributor.name}
                    <button
                      type="button"
                      onClick={() => handleRemovePendingContributor(contributor.id)}
                      className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5 cursor-pointer"
                      aria-label={`Remove ${contributor.name}`}
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Email input + lookup */}
            <div className="flex gap-2">
              <ContributorSearch
                value={contributorEmail}
                onChange={(val) => {
                  setContributorEmail(val);
                  setContributorError('');
                }}
                onUserSelect={(val) => handleAddPendingContributor(val)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPendingContributor(contributorEmail);
                  }
                }}
                disabled={isLookingUp}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!contributorEmail.trim() || isLookingUp}
                onClick={() => handleAddPendingContributor(contributorEmail)}
              >
                {isLookingUp ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
              </Button>
            </div>

            {contributorError && <p className="text-xs text-destructive">{contributorError}</p>}
          </div>

          {/* Server error */}
          {serverError && <p className="text-sm text-destructive">{serverError}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;
