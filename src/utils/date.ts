import { format, formatDistanceToNow, isPast, parseISO } from 'date-fns';

export const formatDate = (date: string | null | undefined): string => {
  if (!date) return '—';
  try {
    return format(parseISO(date), 'MMM d, yyyy');
  } catch {
    return '—';
  }
};

export const formatRelative = (date: string): string => {
  try {
    return formatDistanceToNow(parseISO(date), { addSuffix: true });
  } catch {
    return '';
  }
};

export const isOverdue = (date: string | null | undefined): boolean => {
  if (!date) return false;
  try {
    return isPast(parseISO(date));
  } catch {
    return false;
  }
};
