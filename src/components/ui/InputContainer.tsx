import type { PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

export interface InputContainerProps extends PropsWithChildren {
  title: string;
  error?: string;
  className?: string; // used instead of 'style'
  disabled?: boolean;
}

const InputContainer = ({
  title,
  error,
  className,
  disabled = false,
  children,
}: InputContainerProps) => {
  return (
    <div
      className={cn(
        'space-y-1.5',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
    >
      <Label className="text-foreground">{title}</Label>
      {children}
      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}
    </div>
  );
};

export default InputContainer;
