import { beforeEach, describe, expect, it } from "vitest";
import {
  AUTH_STORAGE_KEY,
  clearSession,
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
});
