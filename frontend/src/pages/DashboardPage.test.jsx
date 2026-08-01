import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client";
import { DashboardPage } from "./DashboardPage";

vi.mock("../api/client", () => ({
  api: {
    getPlantings: vi.fn(),
    getExpenses: vi.fn(),
    getInventoryProducts: vi.fn(),
    getCommodityQuotes: vi.fn(),
  },
}));

function deferred() {
  let resolve;
  const promise = new Promise((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    api.getCommodityQuotes.mockResolvedValue({
      sourceName: "Cotricampo",
      sourceUrl: "https://example.com",
      quotationDate: "2026-07-31",
      quotes: [],
      history: [],
      stale: false,
    });
  });

  it("busca as cotações somente depois dos dados essenciais", async () => {
    const plantingsRequest = deferred();
    const expensesRequest = deferred();
    const inventoryRequest = deferred();
    api.getPlantings.mockReturnValue(plantingsRequest.promise);
    api.getExpenses.mockReturnValue(expensesRequest.promise);
    api.getInventoryProducts.mockReturnValue(inventoryRequest.promise);

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(api.getCommodityQuotes).not.toHaveBeenCalled();

    plantingsRequest.resolve({ content: [] });
    expensesRequest.resolve({ content: [] });
    inventoryRequest.resolve([]);

    await waitFor(() => expect(api.getCommodityQuotes).toHaveBeenCalledOnce());
  });
});
