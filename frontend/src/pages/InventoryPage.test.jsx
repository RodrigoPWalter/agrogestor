import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client";
import { InventoryPage } from "./InventoryPage";

vi.mock("../api/client", () => ({
  api: {
    getInventoryProducts: vi.fn(),
    getInventoryMovements: vi.fn(),
    createInventoryProduct: vi.fn(),
    updateInventoryProduct: vi.fn(),
    deleteInventoryProduct: vi.fn(),
    moveInventory: vi.fn(),
    getInventoryValuationAdjustments: vi.fn(),
    adjustInventoryValuation: vi.fn(),
  },
}));

const product = {
  id: "product-1",
  name: "Glifosato",
  productType: "PESTICIDE",
  productTypeName: "Defensivo",
  quantity: 10,
  unit: "LITER",
  unitName: "L",
  minimumStock: 2,
  expirationDate: "2027-07-20",
  lowStock: false,
  expired: false,
  averageUnitCost: 50,
  inventoryValue: 500,
};

describe("InventoryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getInventoryProducts.mockResolvedValue([product]);
    api.getInventoryMovements.mockResolvedValue([
      {
        id: "movement-1",
        movementTypeName: "Entrada",
        movementDate: "2026-07-20",
        quantity: 10,
      },
    ]);
    api.getInventoryValuationAdjustments.mockResolvedValue([]);
  });

  it("ajusta o custo atual sem editar o cadastro do produto", async () => {
    api.adjustInventoryValuation.mockResolvedValue({});
    render(<InventoryPage />);

    expect(await screen.findByText("Glifosato")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Ajustar custo de Glifosato" }),
    );

    fireEvent.change(screen.getByLabelText("Novo custo por l"), {
      target: { value: "62.5" },
    });
    fireEvent.change(screen.getByLabelText("Motivo do ajuste"), {
      target: { value: "Correção conforme nota fiscal" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar novo custo" }));

    await waitFor(() =>
      expect(api.adjustInventoryValuation).toHaveBeenCalledWith(
        product.id,
        expect.objectContaining({
          newUnitCost: 62.5,
          reason: "Correção conforme nota fiscal",
        }),
      ),
    );
    expect(api.updateInventoryProduct).not.toHaveBeenCalled();
  });

  it("carrega os produtos e abre o histórico de movimentações", async () => {
    render(<InventoryPage />);

    expect(await screen.findByText("Glifosato")).toBeInTheDocument();
    expect(screen.getByText("Saldo disponível")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Movimentar estoque" }));

    await waitFor(() => {
      expect(api.getInventoryMovements).toHaveBeenCalledWith(product.id);
    });
    expect(
      screen.getByRole("heading", { name: "Movimentar Glifosato" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Movimentações recentes")).toBeInTheDocument();
  });

  it("informa quando o histórico de movimentações não pode ser carregado", async () => {
    api.getInventoryMovements.mockRejectedValueOnce(
      new Error("Falha ao consultar as movimentações."),
    );

    render(<InventoryPage />);

    expect(await screen.findByText("Glifosato")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Movimentar estoque" }));

    expect(
      await screen.findByText("Falha ao consultar as movimentações."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Nenhuma movimentação registrada."),
    ).not.toBeInTheDocument();
  });

  it("informa quando os ajustes de custo não podem ser carregados", async () => {
    api.getInventoryValuationAdjustments.mockRejectedValueOnce(
      new Error("Falha ao consultar os ajustes anteriores."),
    );

    render(<InventoryPage />);

    expect(await screen.findByText("Glifosato")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Ajustar custo de Glifosato" }),
    );

    expect(
      await screen.findByText("Falha ao consultar os ajustes anteriores."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Nenhum ajuste de custo registrado."),
    ).not.toBeInTheDocument();
  });

  it("mantém o estoque visível enquanto atualiza após excluir", async () => {
    let finishRefresh;
    api.deleteInventoryProduct.mockResolvedValue();
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<InventoryPage />);

    expect(await screen.findByText("Glifosato")).toBeInTheDocument();

    api.getInventoryProducts.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishRefresh = () => resolve([]);
        }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Excluir produto" }));

    await waitFor(() =>
      expect(api.deleteInventoryProduct).toHaveBeenCalledWith(product.id),
    );
    expect(screen.getByText("Glifosato")).toBeInTheDocument();
    expect(
      screen.queryByText("Conferindo o estoque..."),
    ).not.toBeInTheDocument();

    finishRefresh();
    expect(await screen.findByText("Estoque vazio")).toBeInTheDocument();
  });
});
