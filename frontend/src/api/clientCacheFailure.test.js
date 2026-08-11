import { beforeEach, describe, expect, it, vi } from "vitest";
import { httpClient } from "./httpClient";
import { api } from "./client";
import {
  getCachedResponse,
  putCachedResponse,
} from "../offline/offlineStorage";

vi.mock("./httpClient", () => ({
  httpClient: { request: vi.fn() },
}));
vi.mock("../offline/offlineStorage", () => ({
  getCachedResponse: vi.fn(),
  putCachedResponse: vi.fn(),
}));
vi.mock("../offline/offlineSync", () => ({
  queueMutation: vi.fn(),
}));

describe("cliente da API sem armazenamento local disponível", () => {
  beforeEach(() => {
    httpClient.request.mockReset();
    getCachedResponse.mockReset();
    putCachedResponse.mockReset();
  });

  it("mantém a resposta online quando a gravação do cache falha", async () => {
    const dashboard = { activePlantings: 2 };
    httpClient.request.mockResolvedValue({ status: 200, data: dashboard });
    putCachedResponse.mockRejectedValue(new Error("armazenamento bloqueado"));

    await expect(api.getDashboardSummary()).resolves.toEqual(dashboard);
  });

  it("mantém o erro de conexão quando a leitura do cache falha", async () => {
    const networkError = new Error("sem conexão");
    networkError.offlineEligible = true;
    httpClient.request.mockRejectedValue(networkError);
    getCachedResponse.mockRejectedValue(new Error("armazenamento bloqueado"));

    await expect(api.getDashboardSummary()).rejects.toMatchObject({
      offlineCacheMiss: true,
      message: expect.stringContaining("ainda não foram salvos"),
    });
  });
});
