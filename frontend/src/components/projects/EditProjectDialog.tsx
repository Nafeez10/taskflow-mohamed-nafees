import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ProjectsAPI } from '@/api/routes/ProjectsAPI';
import { projectSchema } from '@/schemas/project';
import InputContainer from '@/components/ui/InputContainer';
import type { Project } from '@/types';
import { toast } from 'sonner';

type FormData = import('zod').infer<typeof projectSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  project: Project;
  onUpdated: () => void;
}

const EditProjectDialog = ({ open, onClose, project, onUpdated }: Props) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(projectSchema) });

  useEffect(() => {
    if (open) {
      reset({
        name: project.name,
        description: project.description ?? '',
      });
    }
  }, [open, project, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      await ProjectsAPI.update(project.id, data);
      toast.success('Project updated');
      onUpdated();
      onClose();
    } catch {
      toast.error('Failed to update project');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <InputContainer title="Name *" error={errors.name?.message}>
                <Input {...field} id="edit-proj-name" placeholder="My Project" />
              </InputContainer>
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <InputContainer title="Description">
                <Textarea
                  {...field}
                  id="edit-proj-desc"
                  placeholder="Optional description"
                  rows={3}
                />
              </InputContainer>
            )}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProjectDialog;
