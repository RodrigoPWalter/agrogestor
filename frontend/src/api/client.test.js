import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { httpClient } from "./httpClient";
import { api } from "./client";
import { saveSession } from "../auth/session";
import {
  listQueuedRequests,
  resetOfflineStorageForTests,
} from "../offline/offlineStorage";

vi.mock("./httpClient", () => ({
  httpClient: {
    request: vi.fn(),
  },
}));

function pagedResponse(content, page, totalPages) {
  return {
    content,
    page,
    size: content.length,
    totalElements: content.length,
    totalPages,
    first: page === 0,
    last: page === totalPages - 1,
  };
}

describe("cliente da API", () => {
  beforeEach(() => {
    httpClient.request.mockReset();
    localStorage.clear();
    resetOfflineStorageForTests();
  });

  afterEach(() => vi.restoreAllMocks());

  it("busca o resumo enxuto da visão geral", async () => {
    httpClient.request.mockResolvedValueOnce({ status: 200, data: {} });

    await api.getDashboardSummary();

    expect(httpClient.request).toHaveBeenCalledWith({
      url: "/api/v1/dashboard",
    });
  });

  it("busca todas as páginas de plantios ativos", async () => {
    httpClient.request
      .mockResolvedValueOnce({
        status: 200,
        data: pagedResponse([{ id: "plantio-1" }], 0, 2),
      })
      .mockResolvedValueOnce({
        status: 200,
        data: pagedResponse([{ id: "plantio-2" }], 1, 2),
      });

    const result = await api.getPlantings();

    expect(result.content).toEqual([{ id: "plantio-1" }, { id: "plantio-2" }]);
    expect(httpClient.request).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        url: "/api/v1/plantings?status=ACTIVE&page=0&size=100",
      }),
    );
    expect(httpClient.request).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        url: "/api/v1/plantings?status=ACTIVE&page=1&size=100",
      }),
    );
  });

  it("mantém filtro por plantio ao carregar gastos paginados", async () => {
    httpClient.request.mockResolvedValueOnce({
      status: 200,
      data: pagedResponse([{ id: "gasto-1" }], 0, 1),
    });

    await api.getExpenses("plantio-123");

    expect(httpClient.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/api/v1/expenses?plantingId=plantio-123&page=0&size=100",
      }),
    );
  });

  it("carrega somente os gastos sem plantio na visão da propriedade", async () => {
    httpClient.request.mockResolvedValueOnce({
      status: 200,
      data: pagedResponse([{ id: "gasto-geral-1" }], 0, 1),
    });

    await api.getPropertyExpenses();

    expect(httpClient.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/api/v1/expenses?unassignedOnly=true&page=0&size=100",
      }),
    );
  });

  it("envia a alteração de perfil pela rota autenticada", async () => {
    const data = {
      nome: "Rodrigo",
      email: "rodrigo@agro.local",
      senhaAtual: "senha-atual",
      novaSenha: null,
    };
    httpClient.request.mockResolvedValueOnce({ status: 200, data: {} });

    await api.updateProfile(data);

    expect(httpClient.request).toHaveBeenCalledWith({
      url: "/api/v1/auth/profile",
      method: "PUT",
      data,
    });
  });

  it("envia uma nova etapa para o plantio informado", async () => {
    const data = {
      stepDate: "2026-07-30",
      plantedAreaHectares: 5,
      seedVariety: "BRS 284",
      startTime: null,
      endTime: null,
      observations: null,
    };
    httpClient.request.mockResolvedValueOnce({ status: 201, data: {} });

    await api.createPlantingStep("planting-1", data);

    expect(httpClient.request).toHaveBeenCalledWith({
      url: "/api/v1/plantings/planting-1/steps",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Idempotency-Key": expect.any(String),
      },
      data,
    });
  });

  it("exclui somente a etapa vinculada ao plantio informado", async () => {
    httpClient.request.mockResolvedValueOnce({ status: 204 });

    await api.deletePlantingStep("planting-1", "step-1");

    expect(httpClient.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/api/v1/plantings/planting-1/steps/step-1",
        method: "DELETE",
      }),
    );
  });

  it("envia uma nova etapa de colheita para o plantio", async () => {
    const data = {
      harvestDate: "2026-07-30",
      harvestedAreaHectares: 8,
      harvestQuantity: 640,
      harvestUnit: "BAGS_60_KG",
      seedVariety: "AG 8700",
    };
    httpClient.request.mockResolvedValueOnce({ status: 201, data: {} });

    await api.createHarvestStep("planting-1", data);

    expect(httpClient.request).toHaveBeenCalledWith({
      url: "/api/v1/plantings/planting-1/harvest-steps",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Idempotency-Key": expect.any(String),
      },
      data,
    });
  });

  it("salva o preço recebido por saca no fechamento da safra", async () => {
    httpClient.request.mockResolvedValueOnce({ status: 200, data: {} });

    await api.saveSeasonClosingPrice("planting-1", 72.5);

    expect(httpClient.request).toHaveBeenCalledWith({
      url: "/api/v1/plantings/planting-1/season-closing/price",
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Idempotency-Key": expect.any(String),
      },
      data: { salePricePer60KgBag: 72.5 },
    });
  });

  it("envia o ajuste do custo atual para o produto informado", async () => {
    const data = {
      adjustmentDate: "2026-08-12",
      newUnitCost: 62.5,
      reason: "Correção conforme nota fiscal",
    };
    httpClient.request.mockResolvedValueOnce({ status: 200, data: {} });

    await api.adjustInventoryValuation("product-1", data);

    expect(httpClient.request).toHaveBeenCalledWith({
      url: "/api/v1/inventory/products/product-1/valuation-adjustments",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Idempotency-Key": expect.any(String),
      },
      data,
    });
  });

  it("guarda um lançamento no aparelho quando está sem internet", async () => {
    saveSession({
      accessToken: "jwt-assinado",
      expiresAt: Date.now() + 60_000,
      user: { email: "produtor@agrogestor.local" },
    });
    vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(false);

    const result = await api.createRainfall({
      measurementDate: "2026-08-10",
      millimeters: 12,
    });
    const requests = await listQueuedRequests("produtor@agrogestor.local");

    expect(result.offlineQueued).toBe(true);
    expect(httpClient.request).not.toHaveBeenCalled();
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      method: "POST",
      url: "/api/v1/rainfall",
      status: "pending",
    });
  });

  it("usa a última resposta salva quando a API fica indisponível", async () => {
    const dashboard = { activePlantings: 2 };
    httpClient.request.mockResolvedValueOnce({ status: 200, data: dashboard });
    await api.getDashboardSummary();

    const networkError = new Error("sem conexão");
    networkError.offlineEligible = true;
    httpClient.request.mockRejectedValueOnce(networkError);

    await expect(api.getDashboardSummary()).resolves.toEqual(dashboard);
  });

  it("diferencia lista vazia de dados ainda não preparados para uso offline", async () => {
    const networkError = new Error("sem conexão");
    networkError.offlineEligible = true;
    httpClient.request.mockRejectedValueOnce(networkError);

    await expect(api.getDashboardSummary()).rejects.toMatchObject({
      offlineCacheMiss: true,
      message: expect.stringContaining("ainda não foram salvos"),
    });
  });
});
