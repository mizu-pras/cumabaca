import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LayoutProvider } from './context/layout-provider';
import App from './App.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LayoutProvider>
      <App />
    </LayoutProvider>
  </StrictMode>
);
