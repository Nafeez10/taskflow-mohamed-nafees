import { CheckSquare } from 'lucide-react';

const PageLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulse ring */}
        <div className="absolute w-16 h-16 bg-primary/20 rounded-2xl animate-ping shadow-[0_0_15px_rgba(0,0,0,0.1)]"></div>

        {/* Inner solid icon container */}
        <div className="relative bg-primary text-primary-foreground p-4 rounded-2xl shadow-xl flex items-center justify-center animate-pulse">
          <CheckSquare className="w-8 h-8" />
        </div>
      </div>
      <div className="mt-8 flex flex-col items-center gap-1.5">
        <span className="text-base text-foreground font-semibold tracking-tight">Starting up</span>
        <span className="text-sm text-muted-foreground font-medium animate-pulse">
          Preparing your workspace...
        </span>
      </div>
    </div>
  );
};

export default PageLoader;
