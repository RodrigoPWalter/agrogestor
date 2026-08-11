import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

  afterEach(() => vi.restoreAllMocks());

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

  it("preserva o token definido para uma sincronização em andamento", async () => {
    saveSession({
      accessToken: "jwt-sessao-atual",
      expiresAt: Date.now() + 60_000,
      user: { email: "atual@agrogestor.local" },
    });

    let requestConfig;
    await httpClient.request({
      url: "/api/v1/expenses",
      headers: { Authorization: "Bearer jwt-sessao-original" },
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

    expect(requestConfig.headers.Authorization).toBe(
      "Bearer jwt-sessao-original",
    );
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

  it("explica quando uma consulta está sem internet", async () => {
    vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(false);

    await expect(
      httpClient.request({
        url: "/api/v1/plantings",
        adapter: async (config) => {
          const error = new Error("Network Error");
          error.config = config;
          throw error;
        },
      }),
    ).rejects.toThrow("Procurando a última cópia salva destes dados.");
  });

  it("explica quando uma consulta demora para atualizar", async () => {
    await expect(
      httpClient.request({
        url: "/api/v1/expenses",
        adapter: async (config) => {
          const error = new Error("timeout");
          error.config = config;
          error.code = "ECONNABORTED";
          throw error;
        },
      }),
    ).rejects.toThrow("O servidor demorou para atualizar estes dados.");
  });

  it("informa que um lançamento será sincronizado quando está offline", async () => {
    vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(false);

    await expect(
      httpClient.request({
        url: "/api/v1/expenses",
        method: "POST",
        data: { amount: 100 },
        adapter: async (config) => {
          const error = new Error("Network Error");
          error.config = config;
          throw error;
        },
      }),
    ).rejects.toThrow("O lançamento ficará salvo neste aparelho.");
  });
});
