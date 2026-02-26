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
