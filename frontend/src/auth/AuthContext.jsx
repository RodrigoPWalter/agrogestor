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
  assertSessionContextCurrent,
  captureSessionContext,
  clearSession,
  readSession,
  saveSession,
  isSessionContextCurrent,
} from "./session";
import {
  SESSION_READY_EVENT,
  refreshOfflineSyncState,
} from "../offline/offlineSync";
import { migrateLegacyOfflineData } from "../offline/offlineStorage";

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
    refreshOfflineSyncState().catch(() => {});
  }, []);

  const expireSession = useCallback(() => {
    clearSession();
    setSession(null);
    setAuthNotice("Sua sessão expirou. Entre novamente para continuar.");
    refreshOfflineSyncState().catch(() => {});
  }, []);

  const login = useCallback(async (credentials) => {
    const response = await api.login(credentials);
    const nextSession = createSession(response);

    saveSession(nextSession);
    setSession(nextSession);
    setAuthNotice("");
    return response.user;
  }, []);

  const updateProfile = useCallback(async (data) => {
    const context = captureSessionContext();
    const response = await api.updateProfile(data);
    const nextSession = createSession(response);
    assertSessionContextCurrent(context);
    saveSession(nextSession);
    setSession(nextSession);
    return response.user;
  }, []);

  useEffect(() => {
    const handleExpiredSession = (event) => {
      if (!event.detail || isSessionContextCurrent(event.detail))
        expireSession();
    };
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
    if (!session) return;
    let active = true;
    migrateLegacyOfflineData(session.user)
      .catch(() => {
        // Preserva os dados originais se o armazenamento local estiver indisponível.
      })
      .finally(() => {
        if (active) window.dispatchEvent(new Event(SESSION_READY_EVENT));
      });
    return () => {
      active = false;
    };
  }, [session]);

  useEffect(() => {
    if (!session?.expiresAt) return undefined;

    let timeoutId;
    const evaluateExpiry = () => {
      // Reavalia a conexão e a conta no vencimento; outra aba pode ter trocado a sessão.
      const current = readSession();
      setSession(current);
      if (!current) {
        setAuthNotice("Sua sessão expirou. Entre novamente para continuar.");
        refreshOfflineSyncState().catch(() => {});
        return;
      }
      if (current.offlineAccess) {
        setAuthNotice(
          "Acesso offline ativo. Entre novamente quando a internet voltar para sincronizar.",
        );
      }
      const deadline = current.offlineAccess
        ? current.offlineAccessUntil
        : current.expiresAt;
      timeoutId = window.setTimeout(
        evaluateExpiry,
        Math.min(Math.max(1, deadline - Date.now()), 2_147_483_647),
      );
    };
    const deadline = session.offlineAccess
      ? session.offlineAccessUntil
      : session.expiresAt;
    if (deadline <= Date.now()) evaluateExpiry();
    else
      timeoutId = window.setTimeout(
        evaluateExpiry,
        Math.min(deadline - Date.now(), 2_147_483_647),
      );
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
        const current = readSession();
        setSession(current);
        if (!current)
          setAuthNotice("Sua sessão expirou. Entre novamente para continuar.");
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
