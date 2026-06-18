import { createBrowserRouter, redirect } from 'react-router';
import { useAuthStore } from './store/useAuthStore';
import { LoginPage } from './features/auth/LoginPage';
import { DashboardPage } from './features/dashboard/DashboardPage'; // We will build this in Phase 3
import { AppLayout } from './components/AppLayout';
import { CreateTestPage } from './features/tests/CreateTestPage';
import { AddQuestionsPage } from './features/questions/AddQuestionsPage';
import { PublishConfirmationPage } from './features/tests/PublishConfirmationPage';
// v7 Loader Guard: Checks auth status BEFORE the route renders
const requireAuthLoader = () => {
  const isAuthenticated = useAuthStore.getState().isAuthenticated;
  if (!isAuthenticated) {
    return redirect('/login');
  }
  return null;
};

// v7 Loader Guard: Prevents logged-in users from seeing the login page
const publicOnlyLoader = () => {
  const isAuthenticated = useAuthStore.getState().isAuthenticated;
  if (isAuthenticated) {
    return redirect('/dashboard');
  }
  return null;
};

// The v7 Data Router Configuration
export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
    loader: publicOnlyLoader,
  },
  {
    path: '/',
    element: <AppLayout />,
    loader: requireAuthLoader, // Protects all child routes automatically
    children: [
      {
        index: true,
        loader: () => redirect('/dashboard'),
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
  path: 'tests/new',
  element: <CreateTestPage />,
},
{
  path: 'tests/new/questions', // or 'tests/:id/questions' when we have real data
  element: <AddQuestionsPage />,
},
{
  path: 'tests/new/publish', 
  element: <PublishConfirmationPage />,
},
      // Future Phase routes will go here:
      // { path: 'tests/new', element: <CreateTestPage /> },
      // { path: 'tests/:id/questions', element: <AddQuestionsPage /> },
    ],
  },
  {
    path: '*',
    loader: () => redirect('/dashboard'),
  },
]);