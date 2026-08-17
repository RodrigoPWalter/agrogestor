import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client";
import { FieldDiaryPage } from "./FieldDiaryPage";

vi.mock("../api/client", () => ({
  api: {
    getAllPlantings: vi.fn(),
    getInventoryProducts: vi.fn(),
    getMachines: vi.fn(),
    getDiaryEntries: vi.fn(),
    deleteDiaryEntry: vi.fn(),
    createDiaryEntry: vi.fn(),
    updateDiaryEntry: vi.fn(),
    createPlantingStep: vi.fn(),
    updatePlantingStep: vi.fn(),
    deletePlantingStep: vi.fn(),
    createHarvestStep: vi.fn(),
    updateHarvestStep: vi.fn(),
    deleteHarvestStep: vi.fn(),
  },
}));

describe("FieldDiaryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getAllPlantings.mockResolvedValue({ content: [] });
    api.getInventoryProducts.mockResolvedValue([]);
    api.getMachines.mockResolvedValue([]);
    api.getDiaryEntries.mockResolvedValue({ content: [] });
  });

  it("carrega os registros do diário apenas uma vez ao abrir a página", async () => {
    render(
      <MemoryRouter>
        <FieldDiaryPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(api.getDiaryEntries).toHaveBeenCalledTimes(1);
    });
    expect(api.getDiaryEntries).toHaveBeenCalledWith("");
  });

  it("avisa quando os dados auxiliares do formulário não carregam", async () => {
    api.getInventoryProducts.mockRejectedValue(new Error("Sem estoque"));

    render(
      <MemoryRouter>
        <FieldDiaryPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText(/não foi possível carregar: estoque/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Nova atividade" }),
    ).toBeEnabled();
  });

  it("mantém o diário visível durante a atualização após excluir", async () => {
    const entry = {
      id: "entry-1",
      activity: "Vistoria do trigo",
      activityTypeName: "Vistoria",
      entryDate: "2026-07-29",
      crop: "Trigo",
      harvest: "2026",
      products: [],
    };
    let finishRefresh;
    api.getDiaryEntries.mockResolvedValueOnce({ content: [entry] });
    api.deleteDiaryEntry.mockResolvedValue();
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <MemoryRouter>
        <FieldDiaryPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Vistoria do trigo")).toBeInTheDocument();

    api.getDiaryEntries.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishRefresh = () => resolve({ content: [] });
        }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Excluir atividade" }));

    await waitFor(() => expect(api.deleteDiaryEntry).toHaveBeenCalledOnce());
    expect(screen.getByText("Vistoria do trigo")).toBeInTheDocument();
    expect(screen.queryByText("Abrindo o diário...")).not.toBeInTheDocument();

    finishRefresh();
    await waitFor(() =>
      expect(screen.queryByText("Vistoria do trigo")).not.toBeInTheDocument(),
    );
  });

  it("registra hectares plantados pelo diário usando a operação do plantio", async () => {
    const planting = {
      id: "planting-1",
      crop: "Milho",
      harvest: "2026",
    };
    api.getAllPlantings.mockResolvedValue({ content: [planting] });
    api.createPlantingStep.mockResolvedValue({});

    render(
      <MemoryRouter>
        <FieldDiaryPage />
      </MemoryRouter>,
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "Nova atividade" }),
    );
    fireEvent.change(screen.getByLabelText("Tipo de acontecimento"), {
      target: { value: "PLANTING" },
    });
    fireEvent.change(screen.getByLabelText("Plantio (obrigatório)"), {
      target: { value: planting.id },
    });
    fireEvent.change(screen.getByLabelText("Hectares plantados nesta etapa"), {
      target: { value: "5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar atividade" }));

    await waitFor(() =>
      expect(api.createPlantingStep).toHaveBeenCalledWith(
        planting.id,
        expect.objectContaining({
          plantedAreaHectares: 5,
        }),
      ),
    );
    expect(api.createDiaryEntry).not.toHaveBeenCalled();
  });

  it("registra área e produção colhidas pelo diário", async () => {
    const planting = {
      id: "planting-1",
      crop: "Milho",
      harvest: "2026",
    };
    api.getAllPlantings.mockResolvedValue({ content: [planting] });
    api.createHarvestStep.mockResolvedValue({});

    render(
      <MemoryRouter>
        <FieldDiaryPage />
      </MemoryRouter>,
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "Nova atividade" }),
    );
    fireEvent.change(screen.getByLabelText("Tipo de acontecimento"), {
      target: { value: "HARVEST" },
    });
    fireEvent.change(screen.getByLabelText("Plantio (obrigatório)"), {
      target: { value: planting.id },
    });
    fireEvent.change(screen.getByLabelText("Hectares colhidos nesta etapa"), {
      target: { value: "4" },
    });
    fireEvent.change(screen.getByLabelText("Quantidade colhida"), {
      target: { value: "320" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar atividade" }));

    await waitFor(() =>
      expect(api.createHarvestStep).toHaveBeenCalledWith(
        planting.id,
        expect.objectContaining({
          harvestedAreaHectares: 4,
          harvestQuantity: 320,
          harvestUnit: "BAGS_60_KG",
        }),
      ),
    );
    expect(api.createDiaryEntry).not.toHaveBeenCalled();
  });

  it("registra venda da produção pelo diário", async () => {
    const planting = {
      id: "planting-1",
      crop: "Soja",
      harvest: "2026/2027",
    };
    api.getAllPlantings.mockResolvedValue({ content: [planting] });
    api.createDiaryEntry.mockResolvedValue({});

    render(
      <MemoryRouter>
        <FieldDiaryPage />
      </MemoryRouter>,
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "Nova atividade" }),
    );
    expect(
      screen.queryByRole("option", { name: "Vistoria" }),
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Tipo de acontecimento"), {
      target: { value: "SALE" },
    });
    fireEvent.change(screen.getByLabelText("Plantio (obrigatório)"), {
      target: { value: planting.id },
    });
    fireEvent.change(
      screen.getByLabelText("Quantidade vendida (sacas de 60 kg)"),
      { target: { value: "200" } },
    );
    fireEvent.change(screen.getByLabelText("Preço por saca (R$)"), {
      target: { value: "122.50" },
    });
    fireEvent.change(screen.getByLabelText("Comprador (opcional)"), {
      target: { value: "Cooperativa" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar atividade" }));

    await waitFor(() =>
      expect(api.createDiaryEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          activityType: "SALE",
          plantingId: planting.id,
          saleQuantityBags: 200,
          salePricePerBag: 122.5,
          buyer: "Cooperativa",
        }),
      ),
    );
  });

  it("registra gasto da propriedade pelo diário", async () => {
    api.createDiaryEntry.mockResolvedValue({});

    render(
      <MemoryRouter>
        <FieldDiaryPage />
      </MemoryRouter>,
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "Nova atividade" }),
    );
    fireEvent.change(screen.getByLabelText("Tipo de acontecimento"), {
      target: { value: "EXPENSE" },
    });
    fireEvent.change(screen.getByLabelText("Descrição do gasto"), {
      target: { value: "Conserto da cerca" },
    });
    fireEvent.change(screen.getByLabelText("Categoria"), {
      target: { value: "MAINTENANCE" },
    });
    fireEvent.change(screen.getByLabelText("Valor do gasto (R$)"), {
      target: { value: "480.50" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar atividade" }));

    await waitFor(() =>
      expect(api.createDiaryEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          activityType: "EXPENSE",
          plantingId: null,
          activity: "Conserto da cerca",
          expenseCategory: "MAINTENANCE",
          amount: 480.5,
        }),
      ),
    );
  });
});
