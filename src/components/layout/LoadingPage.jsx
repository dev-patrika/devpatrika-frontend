import React from 'react';
import { Terminal } from 'lucide-react';
import Skeleton from '../ui/Skeleton';

const LoadingPage = () => {
  return (
    <div className="h-[70vh] w-full flex flex-col items-center justify-center space-y-6 animate-fade-in">
      <div className="flex items-center justify-center p-3 rounded-xl bg-primary/5 text-primary border border-primary/10 animate-pulse">
        <Terminal className="h-10 w-10" />
      </div>
      
      <div className="text-center space-y-2">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-300">
          Compiling Radar Intel
        </h3>
        <p className="text-xs text-muted-foreground">
          Querying local indices and connecting to backend engines...
        </p>
      </div>

      <div className="w-64 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6 mx-auto" />
        <Skeleton className="h-4 w-2/3 mx-auto" />
      </div>
    </div>
  );
};

export default LoadingPage;
