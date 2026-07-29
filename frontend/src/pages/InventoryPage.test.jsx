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
});
