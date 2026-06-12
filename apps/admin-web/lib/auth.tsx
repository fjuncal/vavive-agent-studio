"use client";

import { getMe, type UserProfile } from "@/lib/api";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from "react";

type AuthContextValue = {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  setSession: (token: string, user?: UserProfile | null) => void;
  logout: () => void;
  refreshMe: () => Promise<UserProfile | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "vavive_token";
const USER_KEY = "vavive_user";

function readStoredUser(): UserProfile | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const storedToken = window.localStorage.getItem(TOKEN_KEY);
    const storedUser = readStoredUser();
    setToken(storedToken);
    setUser(storedUser);

    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    getMe()
      .then((profile) => {
        setUser(profile);
        window.localStorage.setItem(USER_KEY, JSON.stringify(profile));
      })
      .catch(() => {
        window.localStorage.removeItem(TOKEN_KEY);
        window.localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const isAuthPage = pathname === "/login";
    if (!token && !isAuthPage) {
      startTransition(() => router.replace("/login"));
      return;
    }
    if (token && isAuthPage) {
      startTransition(() => router.replace("/dashboard"));
    }
  }, [isLoading, pathname, router, token]);

  function setSession(nextToken: string, nextUser?: UserProfile | null) {
    window.localStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
    if (nextUser) {
      window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      setUser(nextUser);
    }
  }

  function logout() {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    startTransition(() => router.replace("/login"));
  }

  async function refreshMe() {
    try {
      const profile = await getMe();
      setUser(profile);
      window.localStorage.setItem(USER_KEY, JSON.stringify(profile));
      return profile;
    } catch {
      logout();
      return null;
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, setSession, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
