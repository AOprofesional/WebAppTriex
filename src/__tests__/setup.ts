import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: () => ({ data: null, error: null }) }), order: () => ({ data: [], error: null }), data: [], error: null }),
      insert: () => ({ select: () => ({ single: () => ({ data: {}, error: null }) }), data: {}, error: null }),
      update: () => ({ eq: () => ({ select: () => ({ single: () => ({ data: {}, error: null }) }), data: {}, error: null }), data: {}, error: null }),
      delete: () => ({ eq: () => ({ data: {}, error: null }), data: {}, error: null }),
    }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  }),
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
  Toaster: () => null,
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/' }),
  useParams: () => ({}),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));
