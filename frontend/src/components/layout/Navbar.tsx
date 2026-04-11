import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import { LogOut, CheckSquare, ClipboardList } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials =
    user?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ?? '??';

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Left — logo + nav links */}
        <div className="flex items-center gap-6">
          <Link to="/projects" className="flex items-center gap-2 font-semibold text-sm">
            <CheckSquare className="h-5 w-5" />
            TaskFlow
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            <Link
              to="/projects"
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors',
                pathname.startsWith('/projects')
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
              )}
            >
              Projects
            </Link>

            <Link
              to="/my-tasks"
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors',
                pathname === '/my-tasks'
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
              )}
            >
              <ClipboardList className="h-3.5 w-3.5" />
              My Tasks
            </Link>
          </nav>
        </div>

        {/* Right — user menu */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 h-8 px-2 rounded-md hover:bg-accent transition-colors outline-none cursor-pointer">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <span className="text-sm hidden sm:block">{user?.name}</span>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              {/* Mobile nav links */}
              <DropdownMenuItem
                className="sm:hidden cursor-pointer"
                onClick={() => navigate('/projects')}
              >
                Projects
              </DropdownMenuItem>
              <DropdownMenuItem
                className="sm:hidden cursor-pointer"
                onClick={() => navigate('/my-tasks')}
              >
                My Tasks
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
