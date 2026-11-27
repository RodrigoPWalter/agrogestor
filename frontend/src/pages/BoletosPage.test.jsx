import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client";
import { BoletosPage } from "./BoletosPage";

vi.mock("../api/client", () => ({
  api: { getDiaryEntries: vi.fn(), updateBoletoStatus: vi.fn() },
}));

describe("BoletosPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getDiaryEntries.mockResolvedValue({
      content: [
        {
          id: "1",
          activityType: "PRODUCT_PURCHASE",
          boletoDueDate: "2020-12-15",
          boletoName: "João",
          boletoPaid: false,
          supplier: "Cooperativa",
          amount: 100,
          products: [{ productName: "Semente" }],
        },
        { id: "2", activityType: "PRODUCT_PURCHASE", boletoDueDate: null },
      ],
    });
  });

  it("mostra o vencimento, nome e situação e registra o pagamento", async () => {
    api.updateBoletoStatus.mockResolvedValue({ boletoPaid: true });
    render(<BoletosPage />);
    expect(await screen.findByText("João")).toBeVisible();
    expect(screen.getByText("15/12/2020")).toBeVisible();
    expect(screen.getByText("Vencido")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Marcar como pago" }));
    await waitFor(() =>
      expect(api.updateBoletoStatus).toHaveBeenCalledWith("1", true),
    );
    expect(await screen.findByText("Pago")).toBeVisible();
  });

  it("informa erro de carregamento em vez de mostrar lista vazia", async () => {
    api.getDiaryEntries.mockRejectedValueOnce(new Error("Sem conexão"));
    render(<BoletosPage />);
    expect(await screen.findByText("Sem conexão")).toBeVisible();
    expect(
      screen.queryByText("Nenhum boleto cadastrado"),
    ).not.toBeInTheDocument();
  });
});
