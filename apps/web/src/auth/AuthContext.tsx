/**
 * Authentication context.
 *
 * Mock mode (VITE_MOCK_MODE=true):
 *   Shows a role-switcher bar. The selected externalId is used directly
 *   as the Bearer token — no Keycloak redirect needed.
 *
 * Production:
 *   Redirects to Keycloak. After returning with a code, exchanges it for
 *   tokens and fetches /users/me to populate the user profile.
 *   (Full PKCE flow is stubbed here — wire up keycloak-js when integrating.)
 */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { setToken } from '../api/client';
import { usersApi } from '../api/users';
import type { User } from '@nextride/shared';

const IS_MOCK = import.meta.env.VITE_MOCK_MODE === 'true';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isMock: boolean;
  login: () => void;
  logout: () => void;
  /** Mock-only: switch to a different pre-seeded user */
  switchMockUser: (externalId: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

// Pre-seeded mock users that match the API seed data
export const MOCK_USERS = [
  { externalId: 'pilot-001', label: 'Martin K. (Pilot)', role: 'pilot' },
  { externalId: 'rider-001', label: 'Erna B. (Fahrgast)', role: 'rider' },
  { externalId: 'facility-001', label: 'Frau Schmidt (Einrichtung)', role: 'facility' },
  { externalId: 'coord-001', label: 'Klaus R. (Koordinator)', role: 'coordinator' },
] as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const res = await usersApi.me();
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Mock mode init ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!IS_MOCK) return;
    const saved = localStorage.getItem('nextride:mock-token') ?? MOCK_USERS[0].externalId;
    setToken(saved);
    fetchMe();
  }, [fetchMe]);

  // ── Production mode init (Keycloak) ───────────────────────────────────────
  useEffect(() => {
    if (IS_MOCK) return;
    const storedToken = sessionStorage.getItem('nextride:token');
    if (storedToken) {
      setToken(storedToken);
      fetchMe();
    } else {
      setLoading(false);
    }
  }, [fetchMe]);

  const switchMockUser = useCallback(
    (externalId: string) => {
      if (!IS_MOCK) return;
      localStorage.setItem('nextride:mock-token', externalId);
      setToken(externalId);
      setLoading(true);
      fetchMe();
    },
    [fetchMe],
  );

  const login = useCallback(() => {
    if (IS_MOCK) {
      // Already initialised from localStorage
      return;
    }
    // Production: redirect to Keycloak authorization endpoint
    const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL;
    const realm = import.meta.env.VITE_KEYCLOAK_REALM;
    const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID;
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback');
    window.location.href = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid+profile+email`;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem('nextride:token');
    if (!IS_MOCK) {
      const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL;
      const realm = import.meta.env.VITE_KEYCLOAK_REALM;
      window.location.href = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/logout?redirect_uri=${encodeURIComponent(window.location.origin)}`;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, isMock: IS_MOCK, login, logout, switchMockUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
