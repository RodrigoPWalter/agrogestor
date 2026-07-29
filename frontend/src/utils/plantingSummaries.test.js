import { describe, expect, it } from "vitest";
import { buildPlantingExpenseSummaries } from "./plantingSummaries";

describe("buildPlantingExpenseSummaries", () => {
  it("agrupa os gastos e calcula o custo por hectare de cada plantio", () => {
    const summaries = buildPlantingExpenseSummaries(
      [
        { id: "planting-1", plantedAreaHectares: 20 },
        { id: "planting-2", plantedAreaHectares: 10 },
      ],
      [
        { plantingId: "planting-1", amount: 1000 },
        { plantingId: "planting-1", amount: 500 },
      ],
    );

    expect(summaries).toEqual({
      "planting-1": {
        totalExpenses: 1500,
        expenseCount: 2,
        expensePerHectare: 75,
      },
      "planting-2": {
        totalExpenses: 0,
        expenseCount: 0,
        expensePerHectare: 0,
      },
    });
  });
});
