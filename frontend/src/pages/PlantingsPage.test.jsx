import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client";
import { PlantingsPage } from "./PlantingsPage";

vi.mock("../api/client", () => ({
  api: {
    getPlantings: vi.fn(),
    getPlantingHistory: vi.fn(),
    getExpenseSummary: vi.fn(),
    createPlanting: vi.fn(),
    updatePlanting: vi.fn(),
    deletePlanting: vi.fn(),
    finishPlanting: vi.fn(),
    reactivatePlanting: vi.fn(),
  },
}));

const activePlanting = {
  id: "active-1",
  crop: "Trigo",
  harvest: "2026",
  plantedAreaHectares: 20,
  plantingDate: "2026-07-10",
  seedVariety: "BRS 284",
  seedQuantity: 900,
  observations: "",
};

const harvestedPlanting = {
  ...activePlanting,
  id: "history-1",
  crop: "Soja",
  harvest: "2025/2026",
  completedAt: "2026-04-20T10:00:00Z",
};

describe("PlantingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getPlantings.mockResolvedValue({ content: [activePlanting] });
    api.getPlantingHistory.mockResolvedValue({
      content: [harvestedPlanting],
    });
    api.getExpenseSummary.mockResolvedValue({
      totalExpenses: 1000,
      expensePerHectare: 50,
      expenseCount: 2,
      categories: [],
    });
  });

  it("alterna entre os plantios ativos e o histórico de safras", async () => {
    render(<PlantingsPage />);

    expect(await screen.findByText("Trigo")).toBeInTheDocument();
    expect(api.getExpenseSummary).toHaveBeenCalledWith(activePlanting.id);

    fireEvent.click(
      screen.getByRole("button", { name: "Histórico de safras" }),
    );

    expect(await screen.findByText("Soja")).toBeInTheDocument();
    await waitFor(() => {
      expect(api.getPlantingHistory).toHaveBeenCalledTimes(1);
      expect(api.getExpenseSummary).toHaveBeenCalledWith(harvestedPlanting.id);
    });
    expect(
      screen.getByRole("button", { name: "Reativar plantio" }),
    ).toBeInTheDocument();
  });
});
