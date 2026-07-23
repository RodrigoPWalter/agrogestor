import { beforeEach, describe, expect, it } from "vitest";
import {
  APP_CACHE_KEY_PREFIX,
  AUTH_STORAGE_KEY,
  buildUserCacheKey,
  clearAppCache,
  clearSession,
  getCurrentUserCacheScope,
  getAccessToken,
  readSession,
  saveSession,
} from "./session";

describe("sessão de autenticação", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("salva e recupera uma sessão válida", () => {
    const session = {
      accessToken: "token-valido",
      expiresAt: Date.now() + 60_000,
      user: { email: "produtor@agrogestor.local" },
    };

    saveSession(session);

    expect(readSession()).toEqual(session);
    expect(getAccessToken()).toBe("token-valido");
  });

  it("remove a sessão quando o token está expirado", () => {
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        accessToken: "token-expirado",
        expiresAt: Date.now() - 1,
        user: { email: "produtor@agrogestor.local" },
      }),
    );

    expect(readSession()).toBeNull();
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it("limpa a sessão armazenada", () => {
    saveSession({
      accessToken: "token",
      expiresAt: Date.now() + 60_000,
      user: { email: "produtor@agrogestor.local" },
    });

    clearSession();

    expect(readSession()).toBeNull();
  });

  it("separa chaves de cache pelo e-mail do usuário", () => {
    saveSession({
      accessToken: "token",
      expiresAt: Date.now() + 60_000,
      user: { email: "Produtor@AgroGestor.local" },
    });

    expect(getCurrentUserCacheScope()).toBe("produtor@agrogestor.local");
    expect(buildUserCacheKey("dashboard:v1")).toBe(
      `${APP_CACHE_KEY_PREFIX}produtor@agrogestor.local:dashboard:v1`,
    );
  });

  it("remove caches locais ao encerrar a sessão", () => {
    localStorage.setItem(`${APP_CACHE_KEY_PREFIX}usuario:dashboard:v1`, "{}");
    localStorage.setItem("agrogestor:dashboard-cache:v1", "{}");

    clearSession();

    expect(
      localStorage.getItem(`${APP_CACHE_KEY_PREFIX}usuario:dashboard:v1`),
    ).toBeNull();
    expect(localStorage.getItem("agrogestor:dashboard-cache:v1")).toBeNull();
  });

  it("limpa apenas dados locais do AgroGestor", () => {
    localStorage.setItem(`${APP_CACHE_KEY_PREFIX}usuario:dashboard:v1`, "{}");
    localStorage.setItem("preferencia-do-navegador", "manter");

    clearAppCache();

    expect(
      localStorage.getItem(`${APP_CACHE_KEY_PREFIX}usuario:dashboard:v1`),
    ).toBeNull();
    expect(localStorage.getItem("preferencia-do-navegador")).toBe("manter");
  });
});
