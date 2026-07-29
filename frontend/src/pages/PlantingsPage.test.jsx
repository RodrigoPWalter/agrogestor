import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client";
import { PlantingsPage } from "./PlantingsPage";

vi.mock("../api/client", () => ({
  api: {
    getPlantings: vi.fn(),
    getPlantingHistory: vi.fn(),
    getExpenses: vi.fn(),
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
    api.getExpenses.mockResolvedValue({
      content: [
        {
          id: "expense-1",
          plantingId: activePlanting.id,
          amount: 1000,
        },
      ],
    });
  });

  it("alterna entre os plantios ativos e o histórico de safras", async () => {
    render(<PlantingsPage />);

    expect(await screen.findByText("Trigo")).toBeInTheDocument();
    expect(api.getExpenses).toHaveBeenCalledTimes(1);

    fireEvent.click(
      screen.getByRole("button", { name: "Histórico de safras" }),
    );

    expect(await screen.findByText("Soja")).toBeInTheDocument();
    await waitFor(() => {
      expect(api.getPlantingHistory).toHaveBeenCalledTimes(1);
      expect(api.getExpenses).toHaveBeenCalledTimes(2);
    });
    expect(
      screen.getByRole("button", { name: "Reativar plantio" }),
    ).toBeInTheDocument();
  });

  it("mantém os plantios visíveis enquanto atualiza após finalizar", async () => {
    let finishRefresh;
    api.finishPlanting.mockResolvedValue();
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<PlantingsPage />);

    expect(await screen.findByText("Trigo")).toBeInTheDocument();

    api.getPlantings.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishRefresh = () => resolve({ content: [] });
        }),
    );
    api.getExpenses.mockResolvedValueOnce({ content: [] });

    fireEvent.click(screen.getByRole("button", { name: "Finalizar plantio" }));

    await waitFor(() =>
      expect(api.finishPlanting).toHaveBeenCalledWith(activePlanting.id),
    );
    expect(screen.getByText("Trigo")).toBeInTheDocument();

    finishRefresh();
    expect(
      await screen.findByText("Comece pelo primeiro plantio"),
    ).toBeInTheDocument();
  });
});
