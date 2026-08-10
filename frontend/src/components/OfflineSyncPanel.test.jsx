import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getOfflineRequests, retryQueuedRequest } from "../offline/offlineSync";
import { OfflineSyncPanel } from "./OfflineSyncPanel";

vi.mock("../offline/offlineSync", () => ({
  discardQueuedRequest: vi.fn(),
  getOfflineRequests: vi.fn(),
  retryQueuedRequest: vi.fn(),
  syncPendingRequests: vi.fn(),
}));

describe("OfflineSyncPanel", () => {
  beforeEach(() => {
    getOfflineRequests.mockReset();
    retryQueuedRequest.mockReset();
  });

  it("informa quando todos os lançamentos foram enviados", async () => {
    getOfflineRequests.mockResolvedValue([]);

    render(<OfflineSyncPanel onClose={() => {}} />);

    expect(
      await screen.findByText(
        "Tudo certo. Não há lançamentos aguardando envio.",
      ),
    ).toBeInTheDocument();
  });

  it("mostra o erro do servidor e permite tentar novamente", async () => {
    getOfflineRequests
      .mockResolvedValueOnce([
        {
          id: "operacao-1",
          url: "/api/v1/inventory/products/produto/movements",
          status: "error",
          lastError: "Quantidade insuficiente em estoque.",
          createdAt: "2026-08-10T18:00:00Z",
        },
      ])
      .mockResolvedValueOnce([]);
    retryQueuedRequest.mockResolvedValue({ synchronized: 1, pending: 0 });

    render(<OfflineSyncPanel onClose={() => {}} />);

    expect(
      await screen.findByText("Quantidade insuficiente em estoque."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));

    await waitFor(() =>
      expect(retryQueuedRequest).toHaveBeenCalledWith("operacao-1"),
    );
  });
});
