import { beforeEach, describe, expect, it } from "vitest";
import {
  APP_CACHE_KEY_PREFIX,
  AUTH_STORAGE_KEY,
  buildUserCacheKey,
  clearAppCache,
  clearSession,
  getCurrentUserCacheScope,
  getAccessToken,
  getUserCacheScope,
  getLegacyScopesForUser,
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

    expect(readSession()).toEqual({
      ...session,
      storageVersion: 2,
      offlineAccess: false,
    });
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

  it("mantém o acesso local temporário quando o aparelho está offline", () => {
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: false,
    });
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        accessToken: "token-expirado",
        expiresAt: Date.now() - 1,
        offlineAccessUntil: Date.now() + 60_000,
        user: { email: "produtor@agrogestor.local" },
      }),
    );

    expect(readSession()?.offlineAccess).toBe(true);
    expect(getAccessToken()).toBeNull();

    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: true,
    });
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

  it("separa chaves de cache por identidade estável e propriedade", () => {
    saveSession({
      accessToken: "token",
      expiresAt: Date.now() + 60_000,
      user: {
        id: "user-1",
        propertyId: "farm-1",
        email: "Produtor@AgroGestor.local",
      },
    });

    expect(getCurrentUserCacheScope()).toBe("user:user-1:property:farm-1");
    expect(buildUserCacheKey("dashboard:v1")).toBe(
      `${APP_CACHE_KEY_PREFIX}user:user-1:property:farm-1:dashboard:v1`,
    );
  });

  it("preserva caches e rascunhos da conta ao encerrar a sessão", () => {
    localStorage.setItem(`${APP_CACHE_KEY_PREFIX}usuario:dashboard:v1`, "{}");
    localStorage.setItem("agrogestor:dashboard-cache:v1", "{}");

    clearSession();

    expect(
      localStorage.getItem(`${APP_CACHE_KEY_PREFIX}usuario:dashboard:v1`),
    ).toBe("{}");
    expect(localStorage.getItem("agrogestor:dashboard-cache:v1")).toBe("{}");
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

  it("não confunde mudança de email com troca de identidade ou propriedade", () => {
    const user = { id: "one", propertyId: "farm", email: "old@local" };
    expect(getUserCacheScope({ ...user, email: "new@local" })).toBe(
      getUserCacheScope(user),
    );
    expect(getUserCacheScope({ ...user, id: "two" })).not.toBe(
      getUserCacheScope(user),
    );
    expect(getUserCacheScope({ ...user, propertyId: "other" })).not.toBe(
      getUserCacheScope(user),
    );
  });

  it("só associa o escopo antigo ao ID observado antes da atualização", () => {
    const user = { id: "one", propertyId: "farm", email: "old@local" };
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ accessToken: "old", expiresAt: Date.now() - 1, user }),
    );
    readSession();
    expect(getLegacyScopesForUser(user)).toEqual(["old@local"]);
    saveSession({
      accessToken: "new",
      expiresAt: Date.now() + 1000,
      user: { ...user, id: "two" },
    });
    expect(getLegacyScopesForUser({ ...user, id: "two" })).toEqual([]);
  });

  it("isola a associação legada quando o mesmo email tem dois IDs observados", () => {
    const user = { id: "one", email: "shared@local" };
    for (const id of ["one", "two"]) {
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
          accessToken: "old",
          expiresAt: Date.now() + 1000,
          user: { ...user, id },
        }),
      );
      readSession();
    }
    expect(getLegacyScopesForUser(user)).toEqual([]);
    expect(getLegacyScopesForUser({ ...user, id: "two" })).toEqual([]);
  });
});
