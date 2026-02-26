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
