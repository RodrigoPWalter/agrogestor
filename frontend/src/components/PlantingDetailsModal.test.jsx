import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client";
import { PlantingDetailsModal } from "./PlantingDetailsModal";

vi.mock("../api/client", () => ({
  api: {
    getExpenseSummary: vi.fn(),
    getExpenses: vi.fn(),
    getDiaryEntries: vi.fn(),
    getRainfallByPlanting: vi.fn(),
    getSeasonClosing: vi.fn(),
    createExpense: vi.fn(),
  },
}));

const planting = {
  id: "planting-1",
  crop: "Trigo",
  harvest: "2026",
  plantedAreaHectares: 20,
  plantingDate: "2026-07-10",
  seedVariety: "BRS 284",
  status: "ACTIVE",
};

describe("PlantingDetailsModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getExpenseSummary.mockResolvedValue({
      totalExpenses: 1000,
      expensePerHectare: 50,
      expenseCount: 1,
    });
    api.getExpenses.mockResolvedValue({
      content: [
        {
          id: "expense-1",
          description: "Adubo",
          amount: 1000,
          expenseDate: "2026-07-12",
        },
      ],
    });
    api.getDiaryEntries.mockResolvedValue({ content: [] });
    api.getRainfallByPlanting.mockResolvedValue([]);
    api.getSeasonClosing.mockResolvedValue({
      totalExpenses: 1000,
      expensePerHectare: 50,
      mainHarvestQuantity: 0,
      mainHarvestUnit: null,
      estimatedResult: null,
      revenueEstimated: null,
      harvestTotals: [],
    });
  });

  it("reúne o resumo, gastos, diário e chuvas do plantio", async () => {
    render(
      <MemoryRouter>
        <PlantingDetailsModal
          planting={planting}
          onClose={vi.fn()}
          onFinish={vi.fn()}
          onReactivate={vi.fn()}
          onChanged={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: "Resumo financeiro" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Fechamento de safra")).toBeInTheDocument();
    expect(screen.getByText(/Adubo/)).toBeInTheDocument();
    expect(screen.getByText("Sem lançamentos no diário.")).toBeInTheDocument();
    expect(screen.getByText("Sem chuva vinculada.")).toBeInTheDocument();

    await waitFor(() => {
      expect(api.getExpenseSummary).toHaveBeenCalledWith(planting.id);
      expect(api.getSeasonClosing).toHaveBeenCalledWith(planting.id);
    });
  });
});
