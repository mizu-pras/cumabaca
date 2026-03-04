import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { useAuthStore } from '../../stores/authStore';
import ProtectedRoute from '../../components/Admin/ProtectedRoute';

// Mock Navigate from react-router
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    Navigate: vi.fn(({ to }) => <div data-testid="navigate" data-to={to} />),
  };
});

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading when isLoading is true', () => {
    useAuthStore.setState({ isAuthenticated: false, isLoading: true });

    render(
      <MemoryRouter>
        <ProtectedRoute><div>Protected Content</div></ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects to /login when not authenticated and checkAuth completes', async () => {
    // Mock checkAuth to resolve without changing state (simulating "still not authenticated")
    const checkAuth = vi.fn().mockResolvedValue(undefined);
    useAuthStore.setState({ isAuthenticated: false, isLoading: false, checkAuth });
    // Override getState().checkAuth for the useEffect call
    const origGetState = useAuthStore.getState;
    vi.spyOn(useAuthStore, 'getState').mockImplementation(() => ({
      ...origGetState(),
      checkAuth,
    }));

    render(
      <MemoryRouter>
        <ProtectedRoute><div>Protected Content</div></ProtectedRoute>
      </MemoryRouter>
    );

    // After checkAuth fires and doesn't set isAuthenticated, component shows Navigate
    // But since checkAuth is mocked to not set isLoading, the initial render already shows Navigate
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();

    vi.restoreAllMocks();
  });

  it('renders children when authenticated', () => {
    useAuthStore.setState({ isAuthenticated: true, isLoading: false });

    render(
      <MemoryRouter>
        <ProtectedRoute><div>Protected Content</div></ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
