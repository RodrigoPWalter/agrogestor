import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client";
import { FieldDiaryPage } from "./FieldDiaryPage";

vi.mock("../api/client", () => ({
  api: {
    getAllPlantings: vi.fn(),
    getInventoryProducts: vi.fn(),
    getMachines: vi.fn(),
    getDiaryEntries: vi.fn(),
  },
}));

describe("FieldDiaryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getAllPlantings.mockResolvedValue({ content: [] });
    api.getInventoryProducts.mockResolvedValue([]);
    api.getMachines.mockResolvedValue([]);
    api.getDiaryEntries.mockResolvedValue({ content: [] });
  });

  it("carrega os registros do diário apenas uma vez ao abrir a página", async () => {
    render(
      <MemoryRouter>
        <FieldDiaryPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(api.getDiaryEntries).toHaveBeenCalledTimes(1);
    });
    expect(api.getDiaryEntries).toHaveBeenCalledWith("");
  });
});
