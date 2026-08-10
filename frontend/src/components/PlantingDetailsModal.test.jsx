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
    getHarvestSteps: vi.fn(),
    getInventoryProducts: vi.fn(),
    createExpense: vi.fn(),
    createDiaryEntry: vi.fn(),
    createPlantingStep: vi.fn(),
    updatePlantingStep: vi.fn(),
    deletePlantingStep: vi.fn(),
    createHarvestStep: vi.fn(),
    updateHarvestStep: vi.fn(),
    deleteHarvestStep: vi.fn(),
  },
}));

const planting = {
  id: "planting-1",
  crop: "Trigo",
  harvest: "2026",
  fieldName: "Talhão norte",
  plannedAreaHectares: 20,
  rowSpacingCentimeters: 70,
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
    api.getHarvestSteps.mockResolvedValue([]);
    api.getInventoryProducts.mockResolvedValue([]);
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
    expect(screen.getByRole("dialog")).toHaveClass("modal--wide");
    expect(screen.getByText("Fechamento de safra")).toBeInTheDocument();
    expect(screen.getByText("70 cm")).toBeInTheDocument();
    expect(screen.getByText("Progresso do plantio")).toBeInTheDocument();
    expect(screen.getByText("Progresso da colheita")).toBeInTheDocument();
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
      seedVariety: "BRS 284",
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
    expect(screen.getByLabelText("Variedade plantada nesta etapa")).toHaveValue(
      "BRS 284",
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
          seedVariety: "BRS 284",
        }),
      );
    });
    expect(
      await screen.findByText("Etapa de plantio adicionada com sucesso."),
    ).toBeInTheDocument();
    expect(screen.getByText("5 ha plantados")).toBeInTheDocument();
    expect(screen.getByText("Variedade: BRS 284")).toBeInTheDocument();
    expect(onChanged).toHaveBeenCalledOnce();
  });

  it("registra a colheita do dia e recalcula a produção", async () => {
    const onChanged = vi.fn();
    const planted = {
      ...planting,
      plantedAreaHectares: 20,
      remainingAreaHectares: 0,
      plantedPercentage: 100,
    };
    const harvestStep = {
      id: "harvest-step-1",
      harvestDate: "2026-07-30",
      harvestedAreaHectares: 8,
      harvestQuantity: 640,
      harvestUnit: "BAGS_60_KG",
      harvestUnitName: "sacas de 60 kg",
      seedVariety: "BRS 284",
      startTime: "08:00:00",
      endTime: "17:00:00",
      observations: "Colheita durante o dia",
    };
    api.createHarvestStep.mockResolvedValue(harvestStep);
    api.getPlantingSteps.mockResolvedValue([
      {
        id: "planting-step-1",
        stepDate: "2026-01-10",
        plantedAreaHectares: 20,
        seedVariety: "BRS 284",
      },
    ]);
    api.getHarvestSteps
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([harvestStep]);

    render(
      <MemoryRouter>
        <PlantingDetailsModal
          planting={planted}
          onClose={vi.fn()}
          onFinish={vi.fn()}
          onReactivate={vi.fn()}
          onChanged={onChanged}
        />
      </MemoryRouter>,
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "Registrar colheita" }),
    );
    fireEvent.change(screen.getByLabelText("Área colhida nesta etapa (ha)"), {
      target: { value: "8" },
    });
    fireEvent.change(screen.getByLabelText("Quantidade produzida"), {
      target: { value: "640" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Registrar colheita" }));

    await waitFor(() => {
      expect(api.createHarvestStep).toHaveBeenCalledWith(
        planting.id,
        expect.objectContaining({
          harvestedAreaHectares: 8,
          harvestQuantity: 640,
          harvestUnit: "BAGS_60_KG",
          seedVariety: "BRS 284",
        }),
      );
    });
    expect(
      await screen.findByText("Colheita do dia registrada com sucesso."),
    ).toBeInTheDocument();
    expect(screen.getByText("8 ha colhidos")).toBeInTheDocument();
    expect(screen.getAllByText(/640 sacas de 60 kg/)).toHaveLength(2);
    expect(screen.getByText("80 sc/ha")).toBeInTheDocument();
    expect(onChanged).toHaveBeenCalledOnce();
  });

  it("usa produto do estoque e transfere o custo para o plantio", async () => {
    const onChanged = vi.fn();
    api.getInventoryProducts.mockResolvedValue([
      {
        id: "product-1",
        name: "Adubo",
        quantity: 3,
        unitName: "unidades",
        averageUnitCost: 5000,
      },
    ]);
    api.createDiaryEntry.mockResolvedValue({ id: "diary-1" });

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

    const registerButtons = await screen.findAllByRole("button", {
      name: "Registrar gasto",
    });
    fireEvent.click(registerButtons[0]);
    fireEvent.click(screen.getByText("Usar do estoque"));
    fireEvent.change(screen.getByLabelText("Produto disponível"), {
      target: { value: "product-1" },
    });
    fireEvent.change(screen.getByLabelText("Quantidade usada"), {
      target: { value: "1" },
    });

    expect(
      screen.getByText("Custo transferido: R$ 5.000,00"),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Usar e transferir custo" }),
    );

    await waitFor(() => {
      expect(api.createDiaryEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          plantingId: planting.id,
          activityType: "PRODUCT_USE",
          productId: "product-1",
          quantity: 1,
        }),
      );
    });
    expect(
      await screen.findByText(
        "Produto usado e custo transferido para o plantio.",
      ),
    ).toBeInTheDocument();
    expect(onChanged).toHaveBeenCalledOnce();
  });
});
