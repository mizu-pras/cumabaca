# Admin UI Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor the admin panel UI to use a modern design inspired by shadcn-admin with collapsible sidebar, breadcrumbs, and updated styling.

**Architecture:** Copy layout components from shadcn-admin and adapt them to work with React Router v7. Add new Radix UI components for sidebar, dropdown-menu, avatar, breadcrumb, and dialog. Keep React Router v7, Zustand auth, and Tailwind CSS v4.

**Tech Stack:** React 19, React Router v7, Radix UI, Tailwind CSS v4, Zustand, TanStack Table

---

## Phase 1: Setup & UI Components

### Task 1: Install New Dependencies

**Files:**
- Modify: `admin/package.json`

**Step 1: Add new dependencies**

Run from project root:
```bash
cd admin && pnpm add @radix-ui/react-avatar@^1.1.3 @radix-ui/react-dropdown-menu@^2.1.4 @radix-ui/react-dialog@^1.1.5 @radix-ui/react-scroll-area@^1.2.2
```

**Step 2: Verify installation**

Run: `cat admin/package.json | grep -A5 "dependencies"`
Expected: Should see the new @radix-ui packages listed

**Step 3: Commit**

```bash
git add admin/package.json admin/pnpm-lock.yaml
git commit -m "feat: add radix ui dependencies for sidebar, dropdown, avatar, breadcrumb, dialog"
```

---

### Task 2: Create Cookies Utility

**Files:**
- Create: `admin/src/lib/cookies.js`

**Step 1: Create cookies utility**

```javascript
/**
 * Simple cookie utility for sidebar state persistence
 * Based on shadcn-admin's cookie handling
 */

export function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const value = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`));
  return value ? value.split('=')[1] : null;
}

export function setCookie(name, value, days = 365) {
  if (typeof document === 'undefined') return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

export function removeCookie(name) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}
```

**Step 2: Verify file exists**

Run: `cat admin/src/lib/cookies.js`
Expected: Should see the cookie utility functions

**Step 3: Commit**

```bash
git add admin/src/lib/cookies.js
git commit -m "feat: add cookie utility for sidebar state persistence"
```

---

### Task 3: Create Layout Provider Context

**Files:**
- Create: `admin/src/context/layout-provider.tsx`

**Step 1: Create layout provider**

```tsx
import { createContext, useContext, useState, ReactNode } from 'react';

type Layout = 'fixed' | 'fluid';

type LayoutContextType = {
  layout: Layout;
  setLayout: (layout: Layout) => void;
};

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within LayoutProvider');
  }
  return context;
}

type LayoutProviderProps = {
  children: ReactNode;
  defaultLayout?: Layout;
};

export function LayoutProvider({ children, defaultLayout = 'fluid' }: LayoutProviderProps) {
  const [layout, setLayout] = useState<Layout>(defaultLayout);

  return (
    <LayoutContext.Provider value={{ layout, setLayout }}>
      {children}
    </LayoutContext.Provider>
  );
}
```

**Step 2: Verify file exists**

Run: `ls -la admin/src/context/`
Expected: Should see layout-provider.tsx

**Step 3: Commit**

```bash
git add admin/src/context/layout-provider.tsx
git commit -m "feat: add layout provider context for flexible layout management"
```

---

### Task 4: Add Sidebar UI Components (1 of 3) - Sidebar Primitive

**Files:**
- Create: `admin/src/components/ui/sidebar.jsx`

**Step 1: Create sidebar component**

Copy from shadcn-admin and adapt for JSX:

```jsx
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
```

**Step 2: Commit**

```bash
git add admin/src/components/ui/sidebar.jsx
git commit -m "feat: add sidebar UI component primitive"
```

---

### Task 5: Add Sidebar UI Components (2 of 3) - Sidebar Trigger & Inset

**Files:**
- Create: `admin/src/components/ui/sidebar-trigger.jsx`
- Create: `admin/src/components/ui/sidebar-inset.jsx`

**Step 1: Create sidebar trigger**

```jsx
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
```

**Step 2: Create sidebar inset**

```jsx
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
```

**Step 3: Verify files created**

Run: `ls -la admin/src/components/ui/sidebar*.jsx`
Expected: Should see sidebar.jsx, sidebar-trigger.jsx, sidebar-inset.jsx

**Step 4: Commit**

```bash
git add admin/src/components/ui/sidebar-trigger.jsx admin/src/components/ui/sidebar-inset.jsx
git commit -m "feat: add sidebar trigger and inset components"
```

---

### Task 6: Add Sidebar UI Components (3 of 3) - Sidebar Provider

**Files:**
- Create: `admin/src/components/ui/sidebar-provider.jsx`

**Step 1: Create sidebar provider**

```jsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getCookie, setCookie } from '../../lib/cookies';

const SidebarContext = createContext({
  isOpen: true,
  setIsOpen: () => {},
  toggle: () => {},
});

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider');
  }
  return context;
}

export function SidebarProvider({ children, defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(() => {
    // Read from cookie on mount
    const savedState = getCookie('sidebar_state');
    return savedState !== null ? savedState === 'true' : defaultOpen;
  });

  const toggle = () => {
    setIsOpen((prev) => {
      const newState = !prev;
      setCookie('sidebar_state', String(newState));
      return newState;
    });
  };

  // Update CSS variable for sidebar width
  useEffect(() => {
    const width = isOpen ? '260px' : '70px';
    document.documentElement.style.setProperty('--sidebar-width', width);
  }, [isOpen]);

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
}
```

**Step 2: Verify file exists**

Run: `cat admin/src/components/ui/sidebar-provider.jsx | head -20`
Expected: Should see the SidebarProvider component

**Step 3: Commit**

```bash
git add admin/src/components/ui/sidebar-provider.jsx
git commit -m "feat: add sidebar provider with cookie persistence"
```

---

### Task 7: Add Avatar UI Component

**Files:**
- Create: `admin/src/components/ui/avatar.jsx`

**Step 1: Create avatar component**

```jsx
import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const avatarVariants = cva(
  'relative flex shrink-0 overflow-hidden rounded-full',
  {
    variants: {
      size: {
        sm: 'h-8 w-8',
        md: 'h-10 w-10',
        lg: 'h-12 w-12',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

const Avatar = React.forwardRef(({ className, size, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(avatarVariants({ size }), className)}
    {...props}
  />
));
Avatar.displayName = 'Avatar';

const AvatarImage = React.forwardRef(({ className, ...props }, ref) => (
  <img
    ref={ref}
    className={cn('aspect-square h-full w-full object-cover', className)}
    {...props}
  />
));
AvatarImage.displayName = 'AvatarImage';

const AvatarFallback = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-medium',
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = 'AvatarFallback';

export { Avatar, AvatarImage, AvatarFallback };
```

**Step 2: Commit**

```bash
git add admin/src/components/ui/avatar.jsx
git commit -m "feat: add avatar UI component"
```

---

### Task 8: Add Dropdown Menu UI Component

**Files:**
- Create: `admin/src/components/ui/dropdown-menu.jsx`

**Step 1: Create dropdown menu component**

```jsx
import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Check, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
const DropdownMenuSub = DropdownMenuPrimitive.Sub;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuSubTrigger = React.forwardRef(
  ({ className, inset, children, ...props }, ref) => (
    <DropdownMenuPrimitive.SubTrigger
      ref={ref}
      className={cn(
        'flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
        'focus:bg-accent data-[state=open]:bg-accent',
        inset && 'pl-8',
        className
      )}
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto h-4 w-4" />
    </DropdownMenuPrimitive.SubTrigger>
  )
);
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

const DropdownMenuSubContent = React.forwardRef(
  ({ className, ...props }, ref) => (
    <DropdownMenuPrimitive.SubContent
      ref={ref}
      className={cn(
        'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 shadow-lg',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
        'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        className
      )}
      {...props}
    />
  )
);
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

const DropdownMenuContent = React.forwardRef(
  ({ className, sideOffset = 4, ...props }, ref) => (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 shadow-md',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
          'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
);
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const DropdownMenuItem = React.forwardRef(
  ({ className, inset, ...props }, ref) => (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(
        'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
        'transition-colors',
        'focus:bg-accent focus:text-accent-foreground',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        inset && 'pl-8',
        className
      )}
      {...props}
    />
  )
);
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuCheckboxItem = React.forwardRef(
  ({ className, children, checked, ...props }, ref) => (
    <DropdownMenuPrimitive.CheckboxItem
      ref={ref}
      className={cn(
        'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none',
        'transition-colors',
        'focus:bg-accent focus:text-accent-foreground',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Check className="h-4 w-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
);
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

const DropdownMenuRadioItem = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <DropdownMenuPrimitive.RadioItem
      ref={ref}
      className={cn(
        'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none',
        'transition-colors',
        'focus:bg-accent focus:text-accent-foreground',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <div className="h-2 w-2 rounded-full bg-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
);
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

const DropdownMenuLabel = React.forwardRef(
  ({ className, inset, ...props }, ref) => (
    <DropdownMenuPrimitive.Label
      ref={ref}
      className={cn(
        'px-2 py-1.5 text-sm font-semibold',
        inset && 'pl-8',
        className
      )}
      {...props}
    />
  )
);
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const DropdownMenuSeparator = React.forwardRef(
  ({ className, ...props }, ref) => (
    <DropdownMenuPrimitive.Separator
      ref={ref}
      className={cn('-mx-1 my-1 h-px bg-muted', className)}
      {...props}
    />
  )
);
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const DropdownMenuShortcut = ({ className, ...props }) => (
  <span className={cn('ml-auto text-xs tracking-widest opacity-60', className)} {...props} />
);
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};
```

**Step 2: Commit**

```bash
git add admin/src/components/ui/dropdown-menu.jsx
git commit -m "feat: add dropdown menu UI component"
```

---

### Task 9: Add Breadcrumb UI Component

**Files:**
- Create: `admin/src/components/ui/breadcrumb.jsx`

**Step 1: Create breadcrumb component**

```jsx
import * as React from 'react';
import { ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '../../lib/utils';

const Breadcrumb = React.forwardRef(({ ...props }, ref) => (
  <nav ref={ref} aria-label="breadcrumb" {...props} />
));
Breadcrumb.displayName = 'Breadcrumb';

const BreadcrumbList = React.forwardRef(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn(
      'flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5',
      className
    )}
    {...props}
  />
));
BreadcrumbList.displayName = 'BreadcrumbList';

const BreadcrumbItem = React.forwardRef(({ className, ...props }, ref) => (
  <li ref={ref} className={cn('inline-flex items-center gap-1.5', className)} {...props} />
));
BreadcrumbItem.displayName = 'BreadcrumbItem';

const BreadcrumbLink = React.forwardRef(({ asChild, className, ...props }, ref) => {
  const Comp = asChild ? React.Fragment : 'a';

  return (
    <Comp
      ref={ref}
      className={cn('transition-colors hover:text-foreground', className)}
      {...props}
    />
  );
});
BreadcrumbLink.displayName = 'BreadcrumbLink';

const BreadcrumbPage = React.forwardRef(({ className, ...props }, ref) => (
  <span
    ref={ref}
    role="link"
    aria-disabled="true"
    aria-current="page"
    className={cn('font-normal text-foreground', className)}
    {...props}
  />
));
BreadcrumbPage.displayName = 'BreadcrumbPage';

const BreadcrumbSeparator = ({ children, className, ...props }) => (
  <li
    role="presentation"
    aria-hidden="true"
    className={cn('[&>svg]:size-3.5', className)}
    {...props}
  >
    {children ?? <ChevronRight />}
  </li>
);
BreadcrumbSeparator.displayName = 'BreadcrumbSeparator';

const BreadcrumbEllipsis = ({ className, ...props }) => (
  <span
    role="presentation"
    aria-hidden="true"
    className={cn('flex h-9 w-9 items-center justify-center', className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More</span>
  </span>
);
BreadcrumbEllipsis.displayName = 'BreadcrumbEllipsis';

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};
```

**Step 2: Commit**

```bash
git add admin/src/components/ui/breadcrumb.jsx
git commit -m "feat: add breadcrumb UI component"
```

---

### Task 10: Add Dialog UI Component

**Files:**
- Create: `admin/src/components/ui/dialog.jsx`

**Step 1: Create dialog component**

```jsx
import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%]',
        'gap-4 border bg-background p-6 shadow-lg duration-200',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
        'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
        'sm:rounded-lg',
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({ className, ...props }) => (
  <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...props} />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
```

**Step 2: Commit**

```bash
git add admin/src/components/ui/dialog.jsx
git commit -m "feat: add dialog UI component"
```

---

## Phase 2: Layout Components

### Task 11: Create Sidebar Data

**Files:**
- Create: `admin/src/components/layout/data/sidebar-data.ts`

**Step 1: Create sidebar navigation data**

```tsx
import {
  Home,
  Globe,
  Link2,
  BookOpen,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  isActive?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const navData: NavGroup[] = [
  {
    title: 'Management',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: Home,
      },
      {
        title: 'Languages',
        href: '/languages',
        icon: Globe,
      },
      {
        title: 'Websites',
        href: '/websites',
        icon: Link2,
      },
      {
        title: 'Komiks',
        href: '/komiks',
        icon: BookOpen,
      },
    ],
  },
];

export const sidebarTitle = 'Cuma Baca';
export const sidebarSubtitle = 'Admin Panel';
```

**Step 2: Commit**

```bash
git add admin/src/components/layout/data/sidebar-data.ts
git commit -m "feat: add sidebar navigation data"
```

---

### Task 12: Create App Sidebar Component

**Files:**
- Create: `admin/src/components/layout/app-sidebar.tsx`

**Step 1: Create app sidebar**

```tsx
import { NavLink, useLocation } from 'react-router';
import { Home, Globe, Link2, BookOpen, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '../ui/sidebar';
import { useAuthStore } from '../../stores/authStore';
import { NavUser } from './nav-user';

const menuItems = [
  { path: '/dashboard', icon: Home, label: 'Dashboard' },
  { path: '/languages', icon: Globe, label: 'Languages' },
  { path: '/websites', icon: Link2, label: 'Websites' },
  { path: '/komiks', icon: BookOpen, label: 'Komiks' },
];

function AppSidebar() {
  const location = useLocation();
  const { user } = useAuthStore();

  return (
    <Sidebar className="bg-background border-border">
      <SidebarHeader className="border-b border-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="font-bold text-lg">CB</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Cuma Baca</span>
            <span className="text-xs text-muted-foreground">Admin Panel</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === item.path || location.pathname.startsWith(item.path + '/')}
                >
                  <NavLink to={item.path}>
                    <item.icon size={18} />
                    <span>{item.label}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
```

**Step 2: Commit**

```bash
git add admin/src/components/layout/app-sidebar.tsx
git commit -m "feat: add app sidebar component with navigation"
```

---

### Task 13: Create Nav User Component

**Files:**
- Create: `admin/src/components/layout/nav-user.tsx`

**Step 1: Create nav user dropdown**

```tsx
import { useNavigate } from 'react-router';
import { LogOut, ChevronsUpDown } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

function NavUser({ user }) {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user?.username
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AD';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="w-full">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer">
          <Avatar size="sm">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start flex-1">
            <span className="text-sm font-medium">{user?.username || 'Admin'}</span>
            <span className="text-xs text-muted-foreground">Administrator</span>
          </div>
          <ChevronsUpDown size={16} className="text-muted-foreground" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.username || 'Admin'}</p>
            <p className="text-xs leading-none text-muted-foreground">Administrator</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NavUser;
```

**Step 2: Commit**

```bash
git add admin/src/components/layout/nav-user.tsx
git commit -m "feat: add nav user dropdown component"
```

---

### Task 14: Create Header Component

**Files:**
- Create: `admin/src/components/layout/header.tsx`

**Step 1: Create header component**

```tsx
import { useNavigate, useLocation } from 'react-router';
import { SidebarTrigger } from '../ui/sidebar-trigger';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumb';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  // Generate breadcrumbs based on current path
  const generateBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter((x) => x);

    const breadcrumbs = [];
    let currentPath = '';

    // Always add Dashboard as first breadcrumb (except if already on dashboard)
    if (pathnames[0] !== 'dashboard') {
      breadcrumbs.push({
        label: 'Dashboard',
        path: '/dashboard',
        isLast: false,
      });
    }

    pathnames.forEach((name, index) => {
      currentPath += `/${name}`;
      const isLast = index === pathnames.length - 1;

      // Format label: capitalize first letter, handle special cases
      let label = name;
      if (name === 'new') {
        label = 'New';
      } else if (name === 'edit') {
        label = 'Edit';
      } else {
        label = label.charAt(0).toUpperCase() + label.slice(1);
      }

      // Don't show ID in breadcrumb for detail pages
      if (/^\d+$/.test(name) && pathnames[index - 1]) {
        const parentName = pathnames[index - 1].charAt(0).toUpperCase() + pathnames[index - 1].slice(1);
        const prevBreadcrumb = breadcrumbs[breadcrumbs.length - 1];
        if (prevBreadcrumb) {
          prevBreadcrumb.label = `${parentName} Details`;
          return; // Skip this iteration as we modified the previous breadcrumb
        }
      }

      breadcrumbs.push({
        label,
        path: currentPath,
        isLast,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
      <SidebarTrigger />
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.path} className="flex items-center gap-1.5">
              <BreadcrumbItem>
                {crumb.isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    asChild
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(crumb.path);
                    }}
                    className="cursor-pointer hover:text-foreground"
                  >
                    <span>{crumb.label}</span>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!crumb.isLast && <BreadcrumbSeparator />}
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}

export default Header;
```

**Step 2: Commit**

```bash
git add admin/src/components/layout/header.tsx
git commit -m "feat: add header component with breadcrumb navigation"
```

---

### Task 15: Update AdminLayout Component

**Files:**
- Modify: `admin/src/pages/Admin/AdminLayout.jsx`

**Step 1: Replace AdminLayout with new components**

```jsx
import { Outlet } from 'react-router';
import { SidebarProvider, useSidebar } from '../../components/ui/sidebar-provider';
import { SidebarInset } from '../../components/ui/sidebar-inset';
import AppSidebar from '../../components/layout/app-sidebar';
import Header from '../../components/layout/header';

function AdminLayoutContent() {
  return (
    <>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </>
  );
}

function AdminLayout() {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen bg-background">
        <AdminLayoutContent />
      </div>
    </SidebarProvider>
  );
}

export default AdminLayout;
```

**Step 2: Commit**

```bash
git add admin/src/pages/Admin/AdminLayout.jsx
git commit -m "refactor: update AdminLayout to use new sidebar and header components"
```

---

### Task 16: Remove Old Sidebar Component

**Files:**
- Delete: `admin/src/components/Admin/Sidebar.jsx`

**Step 1: Remove old sidebar**

```bash
rm admin/src/components/Admin/Sidebar.jsx
```

**Step 2: Verify removal**

Run: `ls admin/src/components/Admin/`
Expected: Should only see ProtectedRoute.jsx

**Step 3: Commit**

```bash
git add admin/src/components/Admin/Sidebar.jsx
git commit -m "refactor: remove old sidebar component"
```

---

## Phase 3: Update Pages

### Task 17: Update Dashboard Page Styling

**Files:**
- Modify: `admin/src/pages/Dashboard/Dashboard.jsx`

**Step 1: Update stat cards with new styling**

```jsx
import { useEffect, useState } from 'react';
import { languagesApi, websitesApi, komiksApi } from '../../lib/adminApi';
import { Globe, Link2, BookOpen, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

function Dashboard() {
  const [stats, setStats] = useState({
    languages: 0,
    websites: 0,
    komiks: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [languages, websites, komiks] = await Promise.all([
          languagesApi.getAll({ limit: 1 }),
          websitesApi.getAll({ limit: 1 }),
          komiksApi.getAll({ limit: 1 }),
        ]);

        setStats({
          languages: languages.data.pagination?.total || 0,
          websites: websites.data.pagination?.total || 0,
          komiks: komiks.data.pagination?.total || 0,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Languages',
      value: stats.languages,
      icon: Globe,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Websites',
      value: stats.websites,
      icon: Link2,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Komiks',
      value: stats.komiks,
      icon: BookOpen,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your komik management system</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin mr-2 text-muted-foreground" />
          <span className="text-muted-foreground">Loading stats...</span>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {statCards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">Total items</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
```

**Step 2: Commit**

```bash
git add admin/src/pages/Dashboard/Dashboard.jsx
git commit -m "refactor: update dashboard page with modern card styling"
```

---

### Task 18: Update Komiks List Page Styling

**Files:**
- Modify: `admin/src/pages/Komiks/index.jsx`

**Step 1: Read the current file to understand structure**

First, let's check the current Komiks page:

```bash
cat admin/src/pages/Komiks/index.jsx
```

**Step 2: Update with modern styling**

The page should use the existing Card component and update button/link styles to match the new design.

```jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { komiksApi } from '../../lib/adminApi';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

function Komiks() {
  const navigate = useNavigate();
  const [komiks, setKomiks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  useEffect(() => {
    fetchKomiks();
  }, [pagination.page]);

  async function fetchKomiks() {
    try {
      const response = await komiksApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
      });
      setKomiks(response.data.data);
      setPagination((prev) => ({
        ...prev,
        total: response.data.pagination?.total || 0,
      }));
    } catch (error) {
      console.error('Failed to fetch komiks:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this komik?')) return;
    try {
      await komiksApi.delete(id);
      fetchKomiks();
    } catch (error) {
      alert('Failed to delete komik: ' + (error.response?.data?.error || error.message));
    }
  }

  const columns = useMemo(
    () => [
      {
        accessorKey: 'title',
        header: 'Title',
        cell: ({ row }) => (
          <button
            onClick={() => navigate(`/komiks/${row.original.id}`)}
            className="font-medium text-left hover:text-primary transition-colors"
          >
            {row.getValue('title')}
          </button>
        ),
      },
      {
        accessorKey: 'language_name',
        header: 'Language',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => {
          const status = getValue();
          return (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              status === 'completed' ? 'bg-green-100 text-green-700' :
              status === 'dropped' ? 'bg-red-100 text-red-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Ongoing'}
            </span>
          );
        },
      },
      {
        accessorKey: 'is_active',
        header: 'Active',
        cell: ({ getValue }) => (
          <span className={getValue() ? 'text-green-600' : 'text-muted-foreground'}>
            {getValue() ? 'Yes' : 'No'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/komiks/${row.original.id}/edit`)}
            >
              <Edit2 size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(row.original.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        ),
      },
    ],
    [navigate]
  );

  const table = useReactTable({
    data: komiks,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Komiks</h1>
          <p className="text-muted-foreground">Manage your comic collection</p>
        </div>
        <Button onClick={() => navigate('/komiks/new')} className="gap-2">
          <Plus size={20} />
          Add Komik
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Komiks</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin mr-2 text-muted-foreground" />
              <span className="text-muted-foreground">Loading komiks...</span>
            </div>
          ) : komiks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No komiks found. Add your first komik to get started.</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            className="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())
                            }
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="divide-y">
                    {table.getRowModel().rows.map((row) => (
                      <tr key={row.id} className="hover:bg-muted/50">
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-4 py-3 text-sm">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {pagination.page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Komiks;
```

**Step 3: Commit**

```bash
git add admin/src/pages/Komiks/index.jsx
git commit -m "refactor: update komiks list page with modern styling"
```

---

### Task 19: Update KomikDetail Page - Remove Breadcrumb from Page

**Files:**
- Modify: `admin/src/pages/Komiks/components/KomikDetail.jsx`

**Step 1: Remove manual back button and breadcrumb (now in header)**

The header component already provides breadcrumb navigation, so we can simplify the KomikDetail page by removing the manual back button and let the header handle navigation.

```jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { komiksApi } from '../../../lib/adminApi';
import { Edit, CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import WebsiteSources from './WebsiteSources';

function KomikDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [komik, setKomik] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchKomik() {
      try {
        const response = await komiksApi.getById(id);
        setKomik(response.data.data);
      } catch (error) {
        setError('Failed to load komik details');
        console.error('Failed to fetch komik:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchKomik();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin mr-2 text-muted-foreground" />
        <span className="text-muted-foreground">Loading komik details...</span>
      </div>
    );
  }

  if (error || !komik) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <p className="text-destructive">{error || 'Komik not found'}</p>
        <Button variant="outline" onClick={() => navigate('/komiks')}>
          Back to Komiks
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with title and actions */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{komik.title}</h1>
          <div className="flex items-center gap-3">
            <Badge variant={
              komik.status === 'completed' ? 'success' :
              komik.status === 'dropped' ? 'destructive' :
              'default'
            }>
              {komik.status?.charAt(0).toUpperCase() + komik.status?.slice(1) || 'Ongoing'}
            </Badge>
            {komik.language_name && (
              <span className="text-sm text-muted-foreground">{komik.language_name}</span>
            )}
            <span className={`flex items-center gap-1 text-sm ${
              komik.is_active ? 'text-green-600' : 'text-muted-foreground'
            }`}>
              {komik.is_active ? <CheckCircle size={14} /> : <XCircle size={14} />}
              {komik.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        <Button onClick={() => navigate(`/komiks/${komik.id}/edit`)} className="gap-2">
          <Edit size={16} />
          Edit Komik
        </Button>
      </div>

      {/* Komik Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cover Image */}
        {komik.cover_image && (
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <img
                  src={komik.cover_image}
                  alt={komik.title}
                  className="w-full rounded-lg object-cover aspect-[2/3]"
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Synopsis */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Synopsis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                {komik.synopsis || 'No synopsis available.'}
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Created:</span>
                  <span className="ml-2 text-muted-foreground">
                    {komik.created_at ? new Date(komik.created_at).toLocaleDateString() : '-'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Last Updated:</span>
                  <span className="ml-2 text-muted-foreground">
                    {komik.updated_at ? new Date(komik.updated_at).toLocaleDateString() : '-'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Website Sources Section */}
      <WebsiteSources komikId={komik.id} komikTitle={komik.title} />
    </div>
  );
}

export default KomikDetail;
```

**Step 2: Create missing Badge component**

We need to add the Badge component:

```bash
cat > admin/src/components/ui/badge.jsx << 'EOF'
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/80',
        success: 'bg-green-500 text-white hover:bg-green-600',
        destructive: 'bg-red-500 text-white hover:bg-red-600',
        outline: 'text-foreground border',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
EOF
```

**Step 3: Commit**

```bash
git add admin/src/components/ui/badge.jsx admin/src/pages/Komiks/components/KomikDetail.jsx
git commit -m "refactor: update komik detail page with modern styling and remove manual breadcrumb"
```

---

### Task 20: Update WebsiteSources Table Styling

**Files:**
- Modify: `admin/src/pages/Komiks/components/WebsiteSources.jsx`

**Step 1: Update with modern table styling**

```jsx
import { useState, useEffect, useMemo } from 'react';
import { komikWebsitesApi } from '../../../lib/adminApi';
import { websitesApi } from '../../../lib/adminApi';
import { Plus, ExternalLink, Trash2, Edit2, Globe, Loader2 } from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import AddWebsiteModal from './AddWebsiteModal';
import EditWebsiteModal from './EditWebsiteModal';

function WebsiteSources({ komikId, komikTitle }) {
  const [websites, setWebsites] = useState([]);
  const [availableWebsites, setAvailableWebsites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState(null);

  useEffect(() => {
    fetchWebsites();
    fetchAvailableWebsites();
  }, [komikId]);

  async function fetchWebsites() {
    try {
      const response = await komikWebsitesApi.getAll({ komik_id: komikId });
      setWebsites(response.data.data);
    } catch (error) {
      setError('Failed to load website sources');
      console.error('Failed to fetch komik websites:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchAvailableWebsites() {
    try {
      const response = await websitesApi.getAll();
      setAvailableWebsites(response.data.data);
    } catch (error) {
      console.error('Failed to fetch available websites:', error);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to remove this website source?')) return;

    try {
      await komikWebsitesApi.delete(id);
      fetchWebsites();
    } catch (error) {
      alert('Failed to remove website: ' + (error.response?.data?.error || error.message));
    }
  }

  function handleAdd() {
    setShowAddModal(true);
  }

  function handleEdit(komikWebsite) {
    setEditingWebsite(komikWebsite);
    setShowEditModal(true);
  }

  function handleAddSuccess() {
    setShowAddModal(false);
    fetchWebsites();
  }

  function handleEditSuccess() {
    setShowEditModal(false);
    setEditingWebsite(null);
    fetchWebsites();
  }

  const columns = useMemo(
    () => [
      {
        accessorKey: 'website_name',
        header: 'Website',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <Globe size={18} className="text-muted-foreground" />
            </div>
            <div>
              <div className="font-medium text-sm">{row.original.website_name}</div>
              <a
                href={row.original.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Visit site <ExternalLink size={12} />
              </a>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'url',
        header: 'Comic URL',
        cell: ({ getValue }) => (
          <div className="max-w-xs">
            <a
              href={getValue()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              <span className="truncate block">{getValue()}</span>
              <ExternalLink size={14} className="shrink-0" />
            </a>
          </div>
        ),
      },
      {
        accessorKey: 'total_chapters',
        header: 'Total Chapters',
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">{getValue() || 0}</span>
        ),
      },
      {
        accessorKey: 'last_checked_at',
        header: 'Last Checked',
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">
            {getValue() ? new Date(getValue()).toLocaleDateString() : 'Never'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(row.original)}
            >
              <Edit2 size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(row.original.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: websites,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Website Sources</CardTitle>
          <Button onClick={handleAdd} size="sm" className="gap-2">
            <Plus size={16} />
            Add Source
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg mb-4">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin mr-2 text-muted-foreground" />
            <span className="text-muted-foreground">Loading website sources...</span>
          </div>
        ) : websites.length === 0 ? (
          <div className="text-center py-12">
            <Globe size={48} className="mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-lg font-medium">No website sources added yet</p>
            <p className="text-sm text-muted-foreground mt-1">Add a website source to track where this komik is available</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <table className="w-full">
              <thead className="bg-muted/50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())
                        }
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Website Modal */}
        {showAddModal && (
          <AddWebsiteModal
            komikId={komikId}
            komikTitle={komikTitle}
            availableWebsites={availableWebsites}
            onClose={() => setShowAddModal(false)}
            onSuccess={handleAddSuccess}
          />
        )}

        {/* Edit Website Modal */}
        {showEditModal && editingWebsite && (
          <EditWebsiteModal
            komikWebsite={editingWebsite}
            onClose={() => {
              setShowEditModal(false);
              setEditingWebsite(null);
            }}
            onSuccess={handleEditSuccess}
          />
        )}
      </CardContent>
    </Card>
  );
}

export default WebsiteSources;
```

**Step 2: Commit**

```bash
git add admin/src/pages/Komiks/components/WebsiteSources.jsx
git commit -m "refactor: update website sources table with modern styling"
```

---

### Task 21: Update Button Component Variants

**Files:**
- Modify: `admin/src/components/ui/button.jsx`

**Step 1: Update button component with proper variants**

```jsx
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

function Button({ className, variant, size, ...props }) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
```

**Step 2: Commit**

```bash
git add admin/src/components/ui/button.jsx
git commit -m "refactor: update button component with proper variants"
```

---

## Phase 4: Final Updates & Cleanup

### Task 22: Update Tailwind Config for Custom Properties

**Files:**
- Modify: `admin/tailwind.config.js`

**Step 1: Add custom CSS variables for theming**

```js
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
};
```

**Step 2: Add CSS variables to index.html or styles**

Edit `admin/index.html` and add the CSS variables to the `<style>` tag in head:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cuma Baca Admin</title>
    <style type="text/tailwindcss">
      @layer base {
        :root {
          --background: 0 0% 100%;
          --foreground: 222.2 47.4% 11.2%;
          --card: 0 0% 100%;
          --card-foreground: 222.2 47.4% 11.2%;
          --popover: 0 0% 100%;
          --popover-foreground: 222.2 47.4% 11.2%;
          --primary: 222.2 47.4% 11.2%;
          --primary-foreground: 210 40% 98%;
          --secondary: 210 40% 96%;
          --secondary-foreground: 222.2 47.4% 11.2%;
          --muted: 210 40% 96%;
          --muted-foreground: 215 4% 46%;
          --accent: 210 40% 96%;
          --accent-foreground: 222.2 47.4% 11.2%;
          --destructive: 0 84% 60%;
          --destructive-foreground: 210 40% 98%;
          --border: 214.3 31.8% 91%;
          --input: 214.3 31.8% 91%;
          --ring: 222.2 84% 5%;
          --radius: 0.5rem;
        }
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

**Step 3: Commit**

```bash
git add admin/tailwind.config.js admin/index.html
git commit -m "feat: add tailwind custom properties for theming"
```

---

### Task 23: Update Main Entry for Layout Provider

**Files:**
- Modify: `admin/src/main.jsx`

**Step 1: Wrap app with LayoutProvider**

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LayoutProvider } from './context/layout-provider';
import App from './App.jsx';
import './styles/index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LayoutProvider>
      <App />
    </LayoutProvider>
  </StrictMode>
);
```

**Step 2: Commit**

```bash
git add admin/src/main.jsx
git commit -m "refactor: wrap app with LayoutProvider"
```

---

### Task 24: Final Verification

**Files:** None (verification task)

**Step 1: Build and test**

```bash
cd admin && pnpm run build
```

Expected: Build completes without errors

**Step 2: Start dev server**

```bash
cd admin && pnpm run dev
```

Expected: Dev server starts successfully on port 5174

**Step 3: Manual testing checklist**

- [ ] Login page works
- [ ] Dashboard loads with styled stat cards
- [ ] Sidebar collapses/expands correctly
- [ ] Sidebar state persists after page reload
- [ ] Breadcrumbs display correctly on all pages
- [ ] Komik detail page shows breadcrumb navigation
- [ ] User dropdown and logout works
- [ ] All CRUD operations still function
- [ ] Modals open/close correctly
- [ ] Tables have proper styling

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete admin UI refactor with shadcn-admin inspired design

- Added collapsible sidebar with cookie persistence
- Added header with breadcrumb navigation
- Added user dropdown with logout
- Updated all pages with modern styling
- Added new UI components: sidebar, avatar, dropdown-menu, breadcrumb, dialog, badge
- Light theme only (no dark mode)
- React Router v7 (not migrated to TanStack Router)"
```

---

## Implementation Complete!

**Summary of Changes:**

1. **New Dependencies**: @radix-ui/react-avatar, @radix-ui/react-dropdown-menu, @radix-ui/react-dialog, @radix-ui/react-scroll-area

2. **New UI Components**: sidebar.jsx, sidebar-trigger.jsx, sidebar-inset.jsx, sidebar-provider.jsx, avatar.jsx, dropdown-menu.jsx, breadcrumb.jsx, dialog.jsx, badge.jsx

3. **New Layout Components**: app-sidebar.tsx, header.tsx, nav-user.tsx, sidebar-data.ts

4. **New Utilities**: lib/cookies.js, context/layout-provider.tsx

5. **Updated Pages**: Dashboard.jsx, Komiks/index.jsx, KomikDetail.jsx, WebsiteSources.jsx, AdminLayout.jsx

6. **Removed Files**: components/Admin/Sidebar.jsx

7. **Configuration Updates**: tailwind.config.js, index.html, main.jsx
