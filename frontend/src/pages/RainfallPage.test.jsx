import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client";
import { RainfallPage } from "./RainfallPage";

vi.mock("../api/client", () => ({
  api: {
    getRainfall: vi.fn(),
    getRainfallSummary: vi.fn(),
    createRainfall: vi.fn(),
    updateRainfall: vi.fn(),
    deleteRainfall: vi.fn(),
  },
}));

const measurement = {
  id: "rain-1",
  measurementDate: "2026-07-29",
  millimeters: 24,
  notes: "Chuva mansa",
};

describe("RainfallPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getRainfall.mockResolvedValue([measurement]);
    api.getRainfallSummary.mockResolvedValue({
      currentMonthTotal: 24,
      lastThirtyDaysTotal: 24,
      lastMeasurementDate: measurement.measurementDate,
      lastMeasurementMillimeters: 24,
    });
  });

  it("mantém as medições visíveis enquanto atualiza após excluir", async () => {
    let finishRefresh;
    api.deleteRainfall.mockResolvedValue();
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<RainfallPage />);

    expect(await screen.findByText("Chuva mansa")).toBeInTheDocument();

    api.getRainfall.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishRefresh = () => resolve([]);
        }),
    );
    api.getRainfallSummary.mockResolvedValueOnce({
      currentMonthTotal: 0,
      lastThirtyDaysTotal: 0,
      lastMeasurementDate: null,
      lastMeasurementMillimeters: null,
    });

    fireEvent.click(screen.getByRole("button", { name: "Excluir medição" }));

    await waitFor(() =>
      expect(api.deleteRainfall).toHaveBeenCalledWith(measurement.id),
    );
    expect(screen.getByText("Chuva mansa")).toBeInTheDocument();
    expect(screen.queryByText("Somando as chuvas...")).not.toBeInTheDocument();

    finishRefresh();
    expect(
      await screen.findByText("Nenhuma chuva registrada"),
    ).toBeInTheDocument();
  });
});
