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
  OFFLINE_SESSION_DURATION_MS,
  clearAppCache,
  clearSession,
  readSession,
  saveSession,
} from "./session";
import { SESSION_READY_EVENT } from "../offline/offlineSync";
import { moveOfflineScope } from "../offline/offlineStorage";

const AuthContext = createContext(null);

function createSession(response) {
  return {
    accessToken: response.accessToken,
    tokenType: response.tokenType,
    expiresAt: Date.now() + response.expiresIn * 1000,
    offlineAccessUntil: Date.now() + OFFLINE_SESSION_DURATION_MS,
    offlineAccess: false,
    user: response.user,
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession);
  const [authNotice, setAuthNotice] = useState("");

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
    setAuthNotice("");
  }, []);

  const expireSession = useCallback(() => {
    clearSession();
    setSession(null);
    setAuthNotice("Sua sessão expirou. Entre novamente para continuar.");
  }, []);

  const login = useCallback(async (credentials) => {
    const response = await api.login(credentials);
    const nextSession = createSession(response);

    saveSession(nextSession);
    setSession(nextSession);
    setAuthNotice("");
    window.dispatchEvent(new Event(SESSION_READY_EVENT));
    return response.user;
  }, []);

  const updateProfile = useCallback(
    async (data) => {
      const previousScope = session?.user?.email?.toLowerCase();
      const response = await api.updateProfile(data);
      const nextSession = createSession(response);
      const nextScope = response.user.email.toLowerCase();

      try {
        await moveOfflineScope(previousScope, nextScope);
      } catch {
        // A atualização da conta já ocorreu no servidor; o cache local é complementar.
      }
      clearAppCache();
      saveSession(nextSession);
      setSession(nextSession);
      window.dispatchEvent(new Event(SESSION_READY_EVENT));
      return response.user;
    },
    [session?.user?.email],
  );

  useEffect(() => {
    const handleExpiredSession = () => expireSession();
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
  }, [expireSession]);

  useEffect(() => {
    if (!session?.expiresAt) return undefined;

    const remainingTime = session.expiresAt - Date.now();
    if (remainingTime <= 0) {
      if (
        navigator.onLine === false &&
        session.offlineAccessUntil > Date.now()
      ) {
        setSession((current) => {
          if (!current) return current;
          const offlineSession = { ...current, offlineAccess: true };
          saveSession(offlineSession);
          return offlineSession;
        });
        setAuthNotice(
          "Acesso offline ativo. Entre novamente quando a internet voltar para sincronizar.",
        );
        return undefined;
      }
      expireSession();
      return undefined;
    }

    const timeoutId = window.setTimeout(expireSession, remainingTime);
    return () => window.clearTimeout(timeoutId);
  }, [
    expireSession,
    session?.expiresAt,
    session?.offlineAccess,
    session?.offlineAccessUntil,
  ]);

  useEffect(() => {
    const handleOnline = () => {
      if (session?.offlineAccess || session?.expiresAt <= Date.now()) {
        expireSession();
      }
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [expireSession, session?.expiresAt, session?.offlineAccess]);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      token: session?.accessToken ?? null,
      isAuthenticated: Boolean(session),
      isOfflineSession: Boolean(session?.offlineAccess),
      login,
      logout,
      updateProfile,
      authNotice,
    }),
    [authNotice, login, logout, session, updateProfile],
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
