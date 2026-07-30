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
  fieldName: "Talhão norte",
  plannedAreaHectares: 20,
  plantedAreaHectares: 20,
  remainingAreaHectares: 0,
  plantedPercentage: 100,
  plantingProgressStatus: "COMPLETED",
  plantingProgressStatusName: "Área totalmente plantada",
  startDate: "2026-07-10",
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

  it("cadastra um plantio com área prevista e sem hectares executados", async () => {
    api.createPlanting.mockResolvedValue({
      ...activePlanting,
      plantedAreaHectares: 0,
      remainingAreaHectares: 20,
      plantedPercentage: 0,
    });

    render(<PlantingsPage />);

    expect(await screen.findByText("Trigo")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Novo plantio" }));

    fireEvent.change(screen.getByLabelText("Cultura"), {
      target: { value: "Soja" },
    });
    fireEvent.change(screen.getByLabelText("Safra"), {
      target: { value: "2026/2027" },
    });
    fireEvent.change(screen.getByLabelText("Talhão ou área"), {
      target: { value: "Talhão 3" },
    });
    fireEvent.change(screen.getByLabelText("Área total prevista (ha)"), {
      target: { value: "30" },
    });
    fireEvent.change(screen.getByLabelText("Variedade da semente"), {
      target: { value: "BRS 284" },
    });
    fireEvent.change(screen.getByLabelText("Quantidade de sementes"), {
      target: { value: "1500" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar plantio" }));

    await waitFor(() =>
      expect(api.createPlanting).toHaveBeenCalledWith(
        expect.objectContaining({
          crop: "Soja",
          harvest: "2026/2027",
          fieldName: "Talhão 3",
          plannedAreaHectares: 30,
        }),
      ),
    );
    expect(api.createPlanting.mock.calls[0][0]).not.toHaveProperty(
      "plantedAreaHectares",
    );
  });
});
