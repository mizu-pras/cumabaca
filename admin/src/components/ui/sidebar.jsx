import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const sidebarVariants = cva('min-h-screen w-[--sidebar-width] border-r transition-all duration-300', {
  variants: {
    variant: {
      default: '',
      inset: 'lg:ml-[--sidebar-width]',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const Sidebar = React.forwardRef(({ className, variant, ...props }, ref) => (
  <aside
    ref={ref}
    className={cn(sidebarVariants({ variant }), className)}
    {...props}
  />
));
Sidebar.displayName = 'Sidebar';

const SidebarHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col gap-2 p-4', className)}
    {...props}
  />
));
SidebarHeader.displayName = 'SidebarHeader';

const SidebarContent = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex-1 overflow-auto py-2', className)}
    {...props}
  />
));
SidebarContent.displayName = 'SidebarContent';

const SidebarFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('p-4 border-t', className)}
    {...props}
  />
));
SidebarFooter.displayName = 'SidebarFooter';

const SidebarGroup = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('py-2', className)}
    {...props}
  />
));
SidebarGroup.displayName = 'SidebarGroup';

const SidebarGroupLabel = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('px-4 py-2 text-xs font-semibold text-muted-foreground', className)}
    {...props}
  />
));
SidebarGroupLabel.displayName = 'SidebarGroupLabel';

const SidebarMenu = React.forwardRef(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn('space-y-1 px-3', className)}
    {...props}
  />
));
SidebarMenu.displayName = 'SidebarMenu';

const SidebarMenuItem = React.forwardRef(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn('', className)}
    {...props}
  />
));
SidebarMenuItem.displayName = 'SidebarMenuItem';

const SidebarMenuButton = React.forwardRef(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? React.Fragment : 'button';
  return (
    <Comp
      ref={ref}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset',
        'disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
});
SidebarMenuButton.displayName = 'SidebarMenuButton';

const SidebarSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('mx-3 my-2 h-px bg-border', className)}
    {...props}
  />
));
SidebarSeparator.displayName = 'SidebarSeparator';

export {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
};
