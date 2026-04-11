import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import ContributorSearch from '@/components/projects/ContributorSearch';
import { ProjectsAPI } from '@/api/routes/ProjectsAPI';
import type { ProjectMember } from '@/types';
import { Crown, X, Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

const getInitials = (name?: string): string => {
  if (!name) return '??';
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

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
  projectId: string;
  isOwner: boolean;
  allMembers: ProjectMember[];
  onMembersChange: () => void;
};

const ContributorManager = ({
  open,
  onClose,
  projectId,
  isOwner,
  allMembers,
  onMembersChange,
}: Props) => {
  const [emailInput, setEmailInput] = useState('');
  const [addError, setAddError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const owner = allMembers.find((m) => m.role === 'owner') ?? null;
  const contributors = allMembers.filter((m) => m.role === 'contributor');

  const handleAddContributor = async (identifier: string) => {
    if (!identifier) return;

    setAddError('');
    setIsAdding(true);

    try {
      await ProjectsAPI.addContributor(projectId, { identifier });
      setEmailInput('');
      onMembersChange();
      toast.success('Contributor added');
    } catch (err) {
      setAddError(extractErrorMessage(err, 'Failed to add contributor'));
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveContributor = async (userId: string, userName: string) => {
    setRemovingId(userId);
    try {
      await ProjectsAPI.removeContributor(projectId, userId);
      onMembersChange();
      toast.success(`${userName} removed from project`);
    } catch {
      toast.error('Failed to remove contributor');
    } finally {
      setRemovingId(null);
    }
  };

  const handleClose = () => {
    setEmailInput('');
    setAddError('');
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-sm overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Project Members</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Owner */}
          {owner && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Owner
              </p>

              <div className="flex items-center gap-3">
                <Avatar size="sm">
                  <AvatarFallback>{getInitials(owner.name)}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{owner.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{owner.email}</p>
                </div>

                <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              </div>
            </div>
          )}

          <Separator />

          {/* Contributors */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Contributors
              </p>
              <Badge variant="secondary" className="text-xs">
                {contributors.length}
              </Badge>
            </div>

            {contributors.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No contributors yet.</p>
            ) : (
              <ul className="space-y-1">
                {contributors.map((contributor) => (
                  <li key={contributor.id} className="flex items-center gap-3 py-1.5">
                    <Avatar size="sm">
                      <AvatarFallback>{getInitials(contributor.name)}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{contributor.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{contributor.email}</p>
                    </div>

                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                        disabled={removingId === contributor.id}
                        onClick={() => handleRemoveContributor(contributor.id, contributor.name)}
                        aria-label={`Remove ${contributor.name}`}
                      >
                        {removingId === contributor.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Add contributor — owner only */}
          {isOwner && (
            <>
              <Separator />

              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Add Contributor
                </p>

                <div className="space-y-1.5">
                  <Label htmlFor="contributor-email">Identity</Label>
                  <div className="flex gap-2">
                    <ContributorSearch
                      id="contributor-email"
                      value={emailInput}
                      onChange={(val) => {
                        setEmailInput(val);
                        setAddError('');
                      }}
                      onUserSelect={(val) => handleAddContributor(val)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddContributor(emailInput);
                        }
                      }}
                      disabled={isAdding}
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={!emailInput.trim() || isAdding}
                      onClick={() => handleAddContributor(emailInput)}
                    >
                      {isAdding ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {addError && <p className="text-xs text-destructive">{addError}</p>}
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ContributorManager;
