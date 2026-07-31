import { beforeEach, describe, expect, it, vi } from "vitest";
import { httpClient } from "./httpClient";
import { api } from "./client";

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
      headers: { "Content-Type": "application/json" },
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
      headers: { "Content-Type": "application/json" },
      data,
    });
  });
});
