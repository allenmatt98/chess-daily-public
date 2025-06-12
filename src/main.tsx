import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App.tsx';
import About from './pages/About.tsx';
import Privacy from './pages/Privacy.tsx';
import Terms from './pages/Terms.tsx';
import AuthCallback from './pages/AuthCallback.tsx';
import HistoricalPuzzles from './pages/HistoricalPuzzles';
import HistoricalPuzzleDetail from './pages/HistoricalPuzzleDetail';
import './index.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/about',
    element: <About />,
  },
  {
    path: '/privacy',
    element: <Privacy />,
  },
  {
    path: '/terms',
    element: <Terms />,
  },
  {
    path: '/auth/callback',
    element: <AuthCallback />,
  },
  {
    path: '/historical-puzzles',
    element: <HistoricalPuzzles />,
  },
  {
    path: '/historical-puzzle/:id',
    element: <HistoricalPuzzleDetail />,
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);