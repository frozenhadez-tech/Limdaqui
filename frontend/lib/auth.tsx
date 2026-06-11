"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { apiFetch } from "./api";

export type User = {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  address: string | null;
  role: string;
};

type RegisterInput = {
  email: string;
  password: string;
  fullName?: string;
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
  /** Replace the cached user after a profile update. */
  updateUser: (user: User) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const TOKEN_KEY = "limdaqui_token";

function postAuth(path: string, body: unknown) {
  return apiFetch<{ token: string; user: User }>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Hydrate from a stored token on first load.
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setLoading(false);
      return;
    }
    setToken(stored);
    apiFetch<{ user: User }>("/api/auth/me", {
      headers: { Authorization: `Bearer ${stored}` },
    })
      .then((data) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const apply = useCallback((data: { token: string; user: User }) => {
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      apply(await postAuth("/api/auth/login", { email, password }));
    },
    [apply],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      apply(await postAuth("/api/auth/register", input));
    },
    [apply],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((next: User) => setUser(next), []);

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
