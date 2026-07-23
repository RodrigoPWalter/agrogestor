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
});
