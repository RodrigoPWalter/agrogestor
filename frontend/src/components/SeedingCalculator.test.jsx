import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client";
import { SeedingCalculator } from "./SeedingCalculator";

vi.mock("../api/client", () => ({
  api: {
    calculateSeeding: vi.fn(),
  },
}));

describe("SeedingCalculator", () => {
  beforeEach(() => {
    api.calculateSeeding.mockReset();
  });

  it("calcula sementes por metro usando peso e PMS", async () => {
    api.calculateSeeding.mockResolvedValue({
      totalEstimatedSeeds: 4625000,
      totalRowLengthMeters: 411111.11,
      seedsPerHectare: 250000,
      seedsPerLinearMeter: 11.25,
      expectedPlantsPerHectare: 202500,
      expectedPlantsPerLinearMeter: 9.11,
    });

    render(<SeedingCalculator />);
    fireEvent.click(
      screen.getByRole("button", { name: /calcular distribuição/i }),
    );

    await waitFor(() => {
      expect(api.calculateSeeding).toHaveBeenCalledWith({
        hectares: 18.5,
        rowSpacingCentimeters: 45,
        totalSeedCount: null,
        totalSeedWeightKilograms: 925,
        thousandSeedWeightGrams: 200,
        germinationPercentage: 90,
        fieldEmergencePercentage: 90,
      });
    });
    expect(await screen.findByText("11,25 sementes/m")).toBeInTheDocument();
    expect(screen.getByText(/9,11 plantas\/m/i)).toBeInTheDocument();
  });
});
