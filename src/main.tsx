import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import './index.css';
import App from './App';

// ✅ FIX: Set global staleTime so queries don't refetch on every mount
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5 minutes — data stays fresh
      refetchOnWindowFocus: false,   // Don't refetch when tab gets focus
      retry: 1,                      // Only retry failed requests once
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
     <App/>
    </QueryClientProvider>
  </StrictMode>
);