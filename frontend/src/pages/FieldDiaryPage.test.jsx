import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
    deleteDiaryEntry: vi.fn(),
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

  it("mantém o diário visível durante a atualização após excluir", async () => {
    const entry = {
      id: "entry-1",
      activity: "Vistoria do trigo",
      activityTypeName: "Vistoria",
      entryDate: "2026-07-29",
      crop: "Trigo",
      harvest: "2026",
      products: [],
    };
    let finishRefresh;
    api.getDiaryEntries.mockResolvedValueOnce({ content: [entry] });
    api.deleteDiaryEntry.mockResolvedValue();
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <MemoryRouter>
        <FieldDiaryPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Vistoria do trigo")).toBeInTheDocument();

    api.getDiaryEntries.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishRefresh = () => resolve({ content: [] });
        }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Excluir atividade" }));

    await waitFor(() => expect(api.deleteDiaryEntry).toHaveBeenCalledOnce());
    expect(screen.getByText("Vistoria do trigo")).toBeInTheDocument();
    expect(screen.queryByText("Abrindo o diário...")).not.toBeInTheDocument();

    finishRefresh();
    await waitFor(() =>
      expect(screen.queryByText("Vistoria do trigo")).not.toBeInTheDocument(),
    );
  });
});
