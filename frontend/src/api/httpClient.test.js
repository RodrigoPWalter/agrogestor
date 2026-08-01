import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession, saveSession } from "../auth/session";
import {
  CONNECTION_STATUS,
  getConnectionStatus,
  resetConnectionStatus,
} from "./connectionStatus";
import { AUTH_EXPIRED_EVENT, httpClient } from "./httpClient";

describe("cliente HTTP", () => {
  beforeEach(() => {
    clearSession();
    resetConnectionStatus();
  });

  it("envia o token da sessão no cabeçalho Authorization", async () => {
    saveSession({
      accessToken: "jwt-assinado",
      expiresAt: Date.now() + 60_000,
      user: { email: "produtor@agrogestor.local" },
    });

    let requestConfig;
    await httpClient.request({
      url: "/api/v1/teste",
      adapter: async (config) => {
        requestConfig = config;
        return {
          data: {},
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        };
      },
    });

    expect(requestConfig.headers.Authorization).toBe("Bearer jwt-assinado");
    expect(getConnectionStatus()).toBe(CONNECTION_STATUS.CONNECTED);
  });

  it("não envia Authorization quando não há sessão", async () => {
    let requestConfig;
    await httpClient.request({
      url: "/api/v1/auth/login",
      adapter: async (config) => {
        requestConfig = config;
        return {
          data: {},
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        };
      },
    });

    expect(requestConfig.headers.Authorization).toBeUndefined();
  });

  it("avisa a aplicação quando uma requisição autenticada recebe 401", async () => {
    saveSession({
      accessToken: "jwt-invalido",
      expiresAt: Date.now() + 60_000,
      user: { email: "produtor@agrogestor.local" },
    });
    const expiredListener = vi.fn();
    window.addEventListener(AUTH_EXPIRED_EVENT, expiredListener);

    await expect(
      httpClient.request({
        url: "/api/v1/plantings",
        adapter: async (config) => {
          const error = new Error("Não autorizado");
          error.config = config;
          error.response = {
            data: { message: "Sessão inválida." },
            status: 401,
          };
          throw error;
        },
      }),
    ).rejects.toThrow("Sessão inválida.");

    expect(expiredListener).toHaveBeenCalledOnce();
    window.removeEventListener(AUTH_EXPIRED_EVENT, expiredListener);
  });
});
