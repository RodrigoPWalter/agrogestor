import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client";
import { DashboardPage } from "./DashboardPage";

vi.mock("../api/client", () => ({
  api: {
    getDashboardSummary: vi.fn(),
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
    const dashboardRequest = deferred();
    api.getDashboardSummary.mockReturnValue(dashboardRequest.promise);

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(api.getCommodityQuotes).not.toHaveBeenCalled();

    dashboardRequest.resolve(emptyDashboardSummary());

    await waitFor(() => expect(api.getCommodityQuotes).toHaveBeenCalledOnce());
    expect(api.getDashboardSummary).toHaveBeenCalledOnce();
  });
});

function emptyDashboardSummary() {
  return {
    metrics: {
      plantedAreaHectares: 0,
      plannedAreaHectares: 0,
      activePlantingsCount: 0,
      totalExpenses: 0,
      expenseCount: 0,
      inventoryProductCount: 0,
      lowStockProductCount: 0,
      costPerHectare: 0,
    },
    recentPlantings: [],
    recentExpenses: [],
    inventoryProducts: [],
  };
}
