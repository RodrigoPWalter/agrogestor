import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
    getPlantingSteps: vi.fn(),
    createExpense: vi.fn(),
    createPlantingStep: vi.fn(),
    updatePlantingStep: vi.fn(),
    deletePlantingStep: vi.fn(),
  },
}));

const planting = {
  id: "planting-1",
  crop: "Trigo",
  harvest: "2026",
  fieldName: "Talhão norte",
  plannedAreaHectares: 20,
  plantedAreaHectares: 0,
  remainingAreaHectares: 20,
  plantedPercentage: 0,
  plantingProgressStatusName: "Não iniciado",
  startDate: "2026-07-10",
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
    api.getPlantingSteps.mockResolvedValue([]);
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
    expect(screen.getByText("Progresso do plantio")).toBeInTheDocument();
    expect(
      screen.getByText(/A semeadura ainda não começou/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Adubo/)).toBeInTheDocument();
    expect(screen.getByText("Sem lançamentos no diário.")).toBeInTheDocument();
    expect(screen.getByText("Sem chuva vinculada.")).toBeInTheDocument();

    await waitFor(() => {
      expect(api.getExpenseSummary).toHaveBeenCalledWith(planting.id);
      expect(api.getSeasonClosing).toHaveBeenCalledWith(planting.id);
    });
  });

  it("adiciona hectares e atualiza o progresso e o diário", async () => {
    const onChanged = vi.fn();
    const step = {
      id: "step-1",
      stepDate: "2026-07-30",
      plantedAreaHectares: 5,
      startTime: "08:00:00",
      endTime: "17:00:00",
      observations: "Plantio durante todo o dia",
    };
    api.createPlantingStep.mockResolvedValue(step);
    api.getPlantingSteps
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([step]);

    render(
      <MemoryRouter>
        <PlantingDetailsModal
          planting={planting}
          onClose={vi.fn()}
          onFinish={vi.fn()}
          onReactivate={vi.fn()}
          onChanged={onChanged}
        />
      </MemoryRouter>,
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "Adicionar hectares" }),
    );
    fireEvent.change(screen.getByLabelText("Área plantada nesta etapa (ha)"), {
      target: { value: "5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));

    await waitFor(() => {
      expect(api.createPlantingStep).toHaveBeenCalledWith(
        planting.id,
        expect.objectContaining({
          plantedAreaHectares: 5,
        }),
      );
    });
    expect(
      await screen.findByText("Etapa de plantio adicionada com sucesso."),
    ).toBeInTheDocument();
    expect(screen.getByText("5 ha plantados")).toBeInTheDocument();
    expect(onChanged).toHaveBeenCalledOnce();
  });
});
