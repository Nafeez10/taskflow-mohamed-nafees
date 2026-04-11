import { useState, useEffect, useRef } from 'react';
import { UsersAPI } from '@/api/routes/UsersAPI';
import type { User } from '@/types';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type * as React from 'react';
import { cn } from '@/lib/utils';

type Props = Omit<React.ComponentProps<'input'>, 'onChange' | 'value'> & {
  value: string;
  onChange: (value: string) => void;
  onUserSelect?: (value: string) => void;
};

const getInitials = (name?: string): string => {
  if (!name) return '??';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const ContributorSearch = ({ value, onChange, onUserSelect, ...props }: Props) => {
  const [results, setResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(async () => {
      const q = value.trim();
      if (q.length < 2) {
        setResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const users = await UsersAPI.search(q);
        setResults(users);
        setShowDropdown(true);
      } catch (e) {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [value]);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [results, showDropdown]);

  const handleSelectUser = (user: User) => {
    setShowDropdown(false);
    const idf = user.username ?? user.email;
    onChange(idf);
    if (onUserSelect) onUserSelect(idf);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showDropdown && results.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        return;
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        handleSelectUser(results[selectedIndex]);
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowDropdown(false);
        return;
      }
    }

    // Defer down to external listeners like CreateProjectDialog native submission loops
    if (props.onKeyDown) {
      props.onKeyDown(e);
    }
  };

  return (
    <div className="relative flex-1" ref={dropdownRef}>
      <Input
        type="text"
        placeholder="Search by name, email or username"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (results.length > 0) setShowDropdown(true);
        }}
        {...props}
        onKeyDown={handleKeyDown}
      />
      {isSearching && (
        <div className="absolute right-3 top-2.5">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}

      {showDropdown && value.trim().length >= 2 && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-popover border border-border rounded-md shadow-md max-h-60 overflow-y-auto">
          <ul className="py-1">
            {results.map((u, idx) => (
              <li
                key={u.id}
                onClick={() => handleSelectUser(u)}
                className={cn(
                  'px-3 py-2 flex items-center gap-3 hover:bg-muted cursor-pointer transition-colors',
                  selectedIndex === idx && 'bg-muted',
                )}
                role="button"
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <Avatar size="sm">
                  <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {u.username ? `@${u.username}` : u.email}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ContributorSearch;
