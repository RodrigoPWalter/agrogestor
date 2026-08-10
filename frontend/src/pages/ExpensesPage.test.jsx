import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client";
import { ExpensesPage } from "./ExpensesPage";

vi.mock("../api/client", () => ({
  api: {
    getAllPlantings: vi.fn(),
    getExpenses: vi.fn(),
    getPropertyExpenses: vi.fn(),
    getExpenseSummary: vi.fn(),
    getPropertyExpenseSummary: vi.fn(),
    createExpense: vi.fn(),
    updateExpense: vi.fn(),
    deleteExpense: vi.fn(),
  },
}));

const planting = {
  id: "planting-1",
  crop: "Trigo",
  harvest: "2026",
  plannedAreaHectares: 20,
  plantedAreaHectares: 20,
};

const expense = {
  id: "expense-1",
  plantingId: planting.id,
  description: "Adubo de base",
  category: "FERTILIZERS",
  categoryDisplayName: "Fertilizantes",
  amount: 1200,
  expenseDate: "2026-07-20",
};

const propertyExpense = {
  id: "expense-property-1",
  plantingId: null,
  description: "Troca de óleo do trator",
  category: "MAINTENANCE",
  categoryDisplayName: "Manutenção",
  amount: 600,
  expenseDate: "2026-07-22",
  managedByMaintenance: true,
};

describe("ExpensesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getAllPlantings.mockResolvedValue({ content: [planting] });
    api.getExpenses.mockResolvedValue({ content: [expense] });
    api.getExpenseSummary.mockResolvedValue({
      totalExpenses: 1200,
      expensePerHectare: 60,
      expenseCount: 1,
      categories: [
        {
          category: "FERTILIZERS",
          categoryDisplayName: "Fertilizantes",
          total: 1200,
          percentage: 100,
        },
      ],
    });
    api.getPropertyExpenses.mockResolvedValue({ content: [propertyExpense] });
    api.getPropertyExpenseSummary.mockResolvedValue({
      totalExpenses: 600,
      averageExpense: 600,
      expenseCount: 1,
      categories: [
        {
          category: "MAINTENANCE",
          categoryDisplayName: "Manutenção",
          total: 600,
          percentage: 100,
        },
      ],
    });
  });

  it("separa os gastos gerais da propriedade dos custos do plantio", async () => {
    render(
      <MemoryRouter>
        <ExpensesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Adubo de base")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Da propriedade" }));

    expect(
      await screen.findByText("Troca de óleo do trator"),
    ).toBeInTheDocument();
    expect(api.getPropertyExpenses).toHaveBeenCalledOnce();
    expect(api.getPropertyExpenseSummary).toHaveBeenCalledOnce();
    expect(screen.getByText("Total da propriedade")).toBeInTheDocument();
    expect(screen.getByText("Média por lançamento")).toBeInTheDocument();
    expect(screen.getByText("Gerenciado em Máquinas")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar gasto" })).toBeNull();
  });

  it("registra um gasto da propriedade sem vincular plantio", async () => {
    api.createExpense.mockResolvedValue({});

    render(
      <MemoryRouter>
        <ExpensesPage />
      </MemoryRouter>,
    );

    await screen.findByText("Adubo de base");
    fireEvent.click(screen.getByRole("tab", { name: "Da propriedade" }));
    await screen.findByText("Troca de óleo do trator");
    fireEvent.click(screen.getByRole("button", { name: "Registrar gasto" }));

    expect(screen.queryByLabelText("Plantio relacionado")).toBeNull();
    expect(screen.getByText("Gasto da propriedade")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Descrição"), {
      target: { value: "Balde de graxa" },
    });
    fireEvent.change(screen.getByLabelText("Valor (R$)"), {
      target: { value: "180" },
    });
    fireEvent.click(
      screen.getAllByRole("button", { name: "Registrar gasto" }).at(-1),
    );

    await waitFor(() =>
      expect(api.createExpense).toHaveBeenCalledWith(
        expect.objectContaining({
          plantingId: null,
          description: "Balde de graxa",
          amount: 180,
        }),
      ),
    );
  });

  it("carrega o resumo e permite pesquisar os gastos do plantio", async () => {
    render(
      <MemoryRouter>
        <ExpensesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Adubo de base")).toBeInTheDocument();
    expect(screen.getAllByText("R$ 1.200,00")).toHaveLength(3);
    expect(api.getExpenses).toHaveBeenCalledWith(planting.id);
    expect(api.getExpenseSummary).toHaveBeenCalledWith(planting.id);

    fireEvent.change(
      screen.getByPlaceholderText("Pesquisar descrição ou categoria"),
      { target: { value: "diesel" } },
    );

    expect(
      screen.getByText("Nenhum lançamento corresponde à pesquisa."),
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByPlaceholderText("Pesquisar descrição ou categoria"),
      { target: { value: "fertilizantes" } },
    );

    await waitFor(() => {
      expect(screen.getByText("Adubo de base")).toBeInTheDocument();
    });
  });

  it("mantém a tabela visível enquanto atualiza após uma exclusão", async () => {
    let finishRefresh;
    api.deleteExpense.mockResolvedValue();
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <MemoryRouter>
        <ExpensesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Adubo de base")).toBeInTheDocument();

    api.getExpenses.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishRefresh = () => resolve({ content: [] });
        }),
    );
    api.getExpenseSummary.mockResolvedValueOnce({
      totalExpenses: 0,
      expensePerHectare: 0,
      expenseCount: 0,
      categories: [],
    });

    fireEvent.click(screen.getByRole("button", { name: "Excluir gasto" }));

    await waitFor(() => expect(api.deleteExpense).toHaveBeenCalledOnce());
    expect(screen.getByText("Adubo de base")).toBeInTheDocument();
    expect(
      screen.queryByText("Calculando os gastos..."),
    ).not.toBeInTheDocument();

    finishRefresh();
    await waitFor(() =>
      expect(screen.queryByText("Adubo de base")).not.toBeInTheDocument(),
    );
  });
});
