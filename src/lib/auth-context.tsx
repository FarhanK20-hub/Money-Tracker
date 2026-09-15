'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithPasscode: (passcode: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signInWithPasscode: async () => {},
  signOut: async () => {},
});

const MOCK_USER: User = { id: 'local-user', name: 'Local User', email: 'user@local.app' };
// For a simple local app, we can just hardcode a passcode or read from env. Let's use '1234' as default.
const VALID_PASSCODE = process.env.NEXT_PUBLIC_LOCAL_PASSCODE || '1234';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check local storage for existing session
    const checkSession = () => {
      const isAuth = localStorage.getItem('local_auth') === 'true';
      if (isAuth) {
        setUser(MOCK_USER);
      } else {
        setUser(null);
      }
      setLoading(false);
    };
    checkSession();
  }, []);

  const signInWithPasscode = async (passcode: string) => {
    setError(null);
    setLoading(true);
    try {
      // Simulate slight delay
      await new Promise(resolve => setTimeout(resolve, 300));
      if (passcode === VALID_PASSCODE) {
        localStorage.setItem('local_auth', 'true');
        setUser(MOCK_USER);
      } else {
        setError('Invalid passcode.');
      }
    } catch (err: unknown) {
      setError('Sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    localStorage.removeItem('local_auth');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signInWithPasscode, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
