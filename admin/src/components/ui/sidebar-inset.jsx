import { cn } from '../../lib/utils';

export function SidebarInset({ className, children, ...props }) {
  return (
    <main
      className={cn(
        'flex-1 overflow-auto',
        // Transition for sidebar collapse
        'transition-all duration-300',
        className
      )}
      {...props}
    >
      {children}
    </main>
  );
}
