import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client";
import { FieldDiaryPage } from "./FieldDiaryPage";

vi.mock("../auth/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-1", propertyId: "property-1", email: "test@example.com" },
  }),
}));

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
    localStorage.clear();
  });

  it.each(["PRODUCT_USE", "PRODUCT_PURCHASE"])(
    "prefills %s without duplicating stock on edit",
    async (activityType) => {
      const product = {
        id: "product-1",
        name: "Adubo",
        quantity: 0,
        unitName: "L",
      };
      const entry = {
        id: "entry-1",
        activity: "Produto registrado",
        activityType,
        entryDate: "2026-07-29",
        products: [
          { productId: product.id, quantity: 10, productName: product.name },
        ],
      };
      api.getInventoryProducts.mockResolvedValue([product]);
      api.getDiaryEntries.mockResolvedValue({ content: [entry] });
      api.updateDiaryEntry.mockResolvedValue({});
      render(
        <MemoryRouter>
          <FieldDiaryPage />
        </MemoryRouter>,
      );
      fireEvent.click(
        await screen.findByRole("button", { name: "Editar atividade" }),
      );
      expect(screen.getByLabelText("Produto")).toHaveValue(product.id);
      expect(
        screen.getByLabelText(
          activityType === "PRODUCT_USE"
            ? "Quantidade usada"
            : "Quantidade comprada",
        ),
      ).toHaveValue(10);
      fireEvent.change(screen.getByLabelText(/Observação/), {
        target: { value: "Texto atualizado" },
      });
      fireEvent.click(
        screen.getByRole("button", { name: "Salvar lançamento" }),
      );
      await waitFor(() =>
        expect(api.updateDiaryEntry).toHaveBeenCalledWith(
          entry.id,
          expect.objectContaining({
            products: [],
            productId: product.id,
            quantity: 10,
            observations: "Texto atualizado",
          }),
        ),
      );
    },
  );

  it("keeps legacy product lines visible and edits only the selected quantity", async () => {
    const entry = {
      id: "entry-1",
      activity: "Aplicação antiga",
      activityType: "PRODUCT_USE",
      entryDate: "2026-07-29",
      products: [
        { productId: "p1", productName: "Adubo", quantity: 10 },
        { productId: "p2", productName: "Defensivo", quantity: 5 },
      ],
    };
    api.getDiaryEntries.mockResolvedValue({ content: [entry] });
    api.updateDiaryEntry.mockResolvedValue({});
    render(
      <MemoryRouter>
        <FieldDiaryPage />
      </MemoryRouter>,
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Editar atividade" }),
    );
    expect(screen.getByLabelText("Quantidade do produto 1")).toHaveValue(10);
    expect(screen.getByLabelText("Quantidade do produto 2")).toHaveValue(5);
    fireEvent.change(screen.getByLabelText("Quantidade do produto 2"), {
      target: { value: "6" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar lançamento" }));
    await waitFor(() =>
      expect(api.updateDiaryEntry).toHaveBeenCalledWith(
        entry.id,
        expect.objectContaining({
          productId: null,
          quantity: null,
          products: [
            { productId: "p1", quantity: 10 },
            { productId: "p2", quantity: 6 },
          ],
        }),
      ),
    );
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
      screen.getByRole("button", { name: "Novo lançamento" }),
    ).toBeEnabled();
  });

  it("abre o formulário já configurado pelo atalho rápido", async () => {
    render(
      <MemoryRouter>
        <FieldDiaryPage />
      </MemoryRouter>,
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "Registrar chuva" }),
    );

    expect(
      screen.getByRole("heading", { name: "Registrar chuva" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Tipo de acontecimento")).toHaveValue("RAIN");
    expect(screen.getByLabelText("Quantidade de chuva (mm)")).toBeRequired();
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
      await screen.findByRole("button", { name: "Novo lançamento" }),
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
    fireEvent.click(screen.getByRole("button", { name: "Salvar lançamento" }));

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
      await screen.findByRole("button", { name: "Novo lançamento" }),
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
    fireEvent.click(screen.getByRole("button", { name: "Salvar lançamento" }));

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
      await screen.findByRole("button", { name: "Novo lançamento" }),
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
    fireEvent.click(screen.getByRole("button", { name: "Salvar lançamento" }));

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

  it("registra compra de combustível com litros pelo diário", async () => {
    api.createDiaryEntry.mockResolvedValue({});

    render(
      <MemoryRouter>
        <FieldDiaryPage />
      </MemoryRouter>,
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "Novo lançamento" }),
    );
    fireEvent.change(screen.getByLabelText("Tipo de acontecimento"), {
      target: { value: "EXPENSE" },
    });
    fireEvent.change(screen.getByLabelText("Descrição do gasto"), {
      target: { value: "Óleo diesel" },
    });
    fireEvent.change(screen.getByLabelText("Categoria"), {
      target: { value: "FUEL" },
    });
    fireEvent.change(screen.getByLabelText("Valor do gasto (R$)"), {
      target: { value: "850" },
    });
    fireEvent.change(
      screen.getByLabelText("Quantidade comprada (L, opcional)"),
      {
        target: { value: "120.5" },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "Salvar lançamento" }));

    await waitFor(() =>
      expect(api.createDiaryEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          activityType: "EXPENSE",
          plantingId: null,
          activity: "Óleo diesel",
          expenseCategory: "FUEL",
          amount: 850,
          fuelLiters: 120.5,
        }),
      ),
    );
  });
});
