import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client";
import { CalculatorPage } from "./CalculatorPage";

vi.mock("../api/client", () => ({
  api: {
    calculateProduction: vi.fn(),
  },
}));

describe("CalculatorPage", () => {
  beforeEach(() => {
    api.calculateProduction.mockReset();
  });

  it("envia o cálculo por hectare e apresenta o resultado", async () => {
    api.calculateProduction.mockResolvedValue({
      totalEstimatedProductionBags: 6000,
      estimatedGrossRevenue: 780000,
      totalCost: 450000,
      estimatedProfit: 330000,
    });

    render(<CalculatorPage />);

    fireEvent.change(screen.getByLabelText("Área plantada (ha)"), {
      target: { value: "100" },
    });
    fireEvent.change(screen.getByLabelText("Produtividade (sacas/ha)"), {
      target: { value: "60" },
    });
    fireEvent.change(screen.getByLabelText("Preço estimado da saca (R$)"), {
      target: { value: "130" },
    });
    fireEvent.change(screen.getByLabelText("Custo por hectare (R$)"), {
      target: { value: "4500" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /calcular estimativa/i }),
    );

    await waitFor(() => {
      expect(api.calculateProduction).toHaveBeenCalledWith({
        hectares: 100,
        expectedYieldBagsPerHectare: 60,
        estimatedPricePerBag: 130,
        totalEstimatedCost: null,
        costPerHectare: 4500,
      });
    });
    expect(await screen.findByText("R$ 330.000,00")).toBeInTheDocument();
  });
});
