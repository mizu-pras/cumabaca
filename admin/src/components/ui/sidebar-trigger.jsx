import { Menu, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export function SidebarTrigger({ isOpen, onToggle, className }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'inline-flex items-center justify-center rounded-md text-sm font-medium',
        'transition-colors focus-visible:outline-none focus-visible:ring-2',
        'disabled:pointer-events-none disabled:opacity-50',
        'hover:bg-accent hover:text-accent-foreground',
        'h-10 w-10',
        className
      )}
      aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
    >
      {isOpen ? <X size={20} /> : <Menu size={20} />}
    </button>
  );
}
