import { beforeEach, describe, expect, it, vi } from "vitest";
import { httpClient } from "../api/httpClient";
import { saveSession } from "../auth/session";
import {
  listQueuedRequests,
  resetOfflineStorageForTests,
} from "./offlineStorage";
import {
  queueMutation,
  refreshOfflineSyncState,
  syncPendingRequests,
} from "./offlineSync";

vi.mock("../api/httpClient", () => ({
  httpClient: {
    request: vi.fn(),
  },
}));

describe("sincronização offline", () => {
  beforeEach(async () => {
    localStorage.clear();
    resetOfflineStorageForTests();
    httpClient.request.mockReset();
    saveSession({
      accessToken: "jwt-assinado",
      expiresAt: Date.now() + 60_000,
      user: { email: "produtor@agrogestor.local" },
    });
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: true,
    });
    await refreshOfflineSyncState();
  });

  it("envia a fila na ordem e mantém a mesma chave contra duplicidade", async () => {
    await queueMutation({
      id: "operacao-1",
      url: "/api/v1/expenses",
      method: "POST",
      data: { description: "Diesel" },
      headers: { "Content-Type": "application/json" },
    });
    httpClient.request.mockResolvedValueOnce({ status: 201, data: {} });

    const result = await syncPendingRequests();

    expect(result).toEqual({ synchronized: 1, pending: 0 });
    expect(httpClient.request).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-Idempotency-Key": "operacao-1",
        }),
      }),
    );
  });

  it("mantém um erro de validação visível e continua os demais envios", async () => {
    await queueMutation({
      id: "operacao-invalida",
      url: "/api/v1/inventory/products/produto/movements",
      method: "POST",
      data: { quantity: 100 },
    });
    await queueMutation({
      id: "operacao-valida",
      url: "/api/v1/rainfall",
      method: "POST",
      data: { millimeters: 10 },
    });
    const validationError = new Error("Quantidade insuficiente em estoque.");
    validationError.status = 422;
    httpClient.request
      .mockRejectedValueOnce(validationError)
      .mockResolvedValueOnce({ status: 201, data: {} });

    await syncPendingRequests();
    const requests = await listQueuedRequests("produtor@agrogestor.local");

    expect(httpClient.request).toHaveBeenCalledTimes(2);
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      id: "operacao-invalida",
      status: "error",
      lastError: "Quantidade insuficiente em estoque.",
      httpStatus: 422,
    });
  });

  it("mantém falhas temporárias do servidor na fila para tentar novamente", async () => {
    await queueMutation({
      id: "operacao-temporaria",
      url: "/api/v1/expenses",
      method: "POST",
      data: { description: "Diesel" },
    });
    const serverError = new Error("Servidor indisponível.");
    serverError.status = 503;
    httpClient.request.mockRejectedValueOnce(serverError);

    await syncPendingRequests();
    const requests = await listQueuedRequests("produtor@agrogestor.local");

    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      status: "pending",
      attempts: 1,
      httpStatus: 503,
    });
  });

  it("interrompe a fila antiga quando a pessoa troca de conta", async () => {
    await queueMutation({
      id: "operacao-antiga-1",
      url: "/api/v1/expenses",
      method: "POST",
      data: { description: "Diesel" },
    });
    await queueMutation({
      id: "operacao-antiga-2",
      url: "/api/v1/rainfall",
      method: "POST",
      data: { millimeters: 12 },
    });

    let finishFirstRequest;
    httpClient.request.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishFirstRequest = resolve;
        }),
    );
    const synchronization = syncPendingRequests();
    await vi.waitFor(() => expect(httpClient.request).toHaveBeenCalledOnce());

    saveSession({
      accessToken: "jwt-outra-conta",
      expiresAt: Date.now() + 60_000,
      user: { email: "outra@agrogestor.local" },
    });
    finishFirstRequest({ status: 201, data: {} });
    await synchronization;

    expect(httpClient.request).toHaveBeenCalledOnce();
    expect(httpClient.request).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-assinado",
        }),
      }),
    );
    expect(await listQueuedRequests("produtor@agrogestor.local")).toHaveLength(
      1,
    );
    expect(await listQueuedRequests("outra@agrogestor.local")).toEqual([]);
  });
});
