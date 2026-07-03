import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "../api/client";
import { AUTH_EXPIRED_EVENT } from "../api/httpClient";
import {
  AUTH_STORAGE_KEY,
  clearSession,
  readSession,
  saveSession,
} from "./session";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  const login = useCallback(async (credentials) => {
    const response = await api.login(credentials);
    const nextSession = {
      accessToken: response.accessToken,
      tokenType: response.tokenType,
      expiresAt: Date.now() + response.expiresIn * 1000,
      user: response.user,
    };

    saveSession(nextSession);
    setSession(nextSession);
    return response.user;
  }, []);

  useEffect(() => {
    const handleExpiredSession = () => logout();
    const handleStorageChange = (event) => {
      if (event.key === AUTH_STORAGE_KEY) {
        setSession(readSession());
      }
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpiredSession);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpiredSession);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [logout]);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      token: session?.accessToken ?? null,
      isAuthenticated: Boolean(session),
      login,
      logout,
    }),
    [login, logout, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  }

  return context;
}
