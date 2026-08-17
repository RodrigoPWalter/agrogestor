import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../api/client";
import { ProductionSalesSection } from "./ProductionSalesSection";

vi.mock("../../api/client", () => ({
  api: {
    createProductionSale: vi.fn(),
    updateProductionSale: vi.fn(),
    deleteProductionSale: vi.fn(),
  },
}));

const stock = {
  plantingId: "planting-1",
  harvestedBags: 300,
  soldBags: 100,
  availableBags: 200,
  revenue: 7000,
  averageSalePrice: 70,
  saleCount: 1,
};

describe("ProductionSalesSection", () => {
  beforeEach(() => vi.clearAllMocks());

  it("registra uma venda usando somente o saldo colhido", async () => {
    const onChanged = vi.fn().mockResolvedValue(undefined);
    api.createProductionSale.mockResolvedValue({ id: "sale-2" });

    render(
      <ProductionSalesSection stock={stock} sales={[]} onChanged={onChanged} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Registrar venda" }));
    fireEvent.change(screen.getByLabelText("Quantidade (sacas de 60 kg)"), {
      target: { value: "50" },
    });
    fireEvent.change(screen.getByLabelText("Preço por saca"), {
      target: { value: "72.5" },
    });
    fireEvent.change(screen.getByLabelText("Comprador (opcional)"), {
      target: { value: "Cooperativa" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar venda" }));

    await waitFor(() =>
      expect(api.createProductionSale).toHaveBeenCalledWith(
        stock.plantingId,
        expect.objectContaining({
          quantityBags: 50,
          pricePerBag: 72.5,
          buyer: "Cooperativa",
        }),
      ),
    );
    expect(onChanged).toHaveBeenCalled();
    expect(
      await screen.findByText("Venda registrada e saldo atualizado."),
    ).toBeInTheDocument();
  });
});
