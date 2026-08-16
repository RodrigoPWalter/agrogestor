import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client";
import { MachinesPage } from "./MachinesPage";

vi.mock("../api/client", () => ({
  api: {
    getMachines: vi.fn(),
    getMaintenances: vi.fn(),
    createMachine: vi.fn(),
    updateMachine: vi.fn(),
    deleteMachine: vi.fn(),
    createMaintenance: vi.fn(),
    updateMaintenance: vi.fn(),
    deleteMaintenance: vi.fn(),
  },
}));

const machine = {
  id: "machine-1",
  brand: "John Deere",
  model: "6110J",
  manufactureYear: 2024,
  usageHours: 450,
  reviewDue: false,
  nextReviewHours: 500,
  totalMaintenanceCost: 1700,
  preventiveMaintenanceCost: 500,
  correctiveMaintenanceCost: 1200,
  maintenanceCount: 3,
  preventiveMaintenanceCount: 2,
  correctiveMaintenanceCount: 1,
};

describe("MachinesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getMachines.mockResolvedValue([machine]);
    api.getMaintenances.mockResolvedValue([]);
  });

  it("mostra os custos de manutenção separados em cada máquina", async () => {
    render(<MachinesPage />);

    expect(await screen.findByText("R$ 1.700,00")).toBeInTheDocument();
    expect(screen.getByText("R$ 500,00")).toBeInTheDocument();
    expect(screen.getByText("R$ 1.200,00")).toBeInTheDocument();
    expect(screen.getByText("3 manutenções")).toBeInTheDocument();
  });

  it("mantém a frota visível enquanto atualiza após excluir", async () => {
    let finishRefresh;
    api.deleteMachine.mockResolvedValue();
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<MachinesPage />);

    expect(await screen.findByText("John Deere 6110J")).toBeInTheDocument();

    api.getMachines.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishRefresh = () => resolve([]);
        }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Excluir máquina" }));

    await waitFor(() =>
      expect(api.deleteMachine).toHaveBeenCalledWith(machine.id),
    );
    expect(screen.getByText("John Deere 6110J")).toBeInTheDocument();
    expect(screen.queryByText("Carregando a frota...")).not.toBeInTheDocument();

    finishRefresh();
    expect(
      await screen.findByText("Nenhuma máquina cadastrada"),
    ).toBeInTheDocument();
  });

  it("não mantém o histórico da máquina anterior durante uma nova consulta", async () => {
    const secondMachine = {
      ...machine,
      id: "machine-2",
      brand: "New Holland",
      model: "T7",
    };
    api.getMachines.mockResolvedValueOnce([machine, secondMachine]);
    api.getMaintenances
      .mockResolvedValueOnce([
        {
          id: "maintenance-1",
          maintenanceType: "PREVENTIVE",
          maintenanceTypeName: "Preventiva",
          maintenanceDate: "2026-08-10",
          cost: 100,
        },
      ])
      .mockRejectedValueOnce(new Error("Falha ao consultar as manutenções."));

    render(<MachinesPage />);

    expect(await screen.findByText("John Deere 6110J")).toBeInTheDocument();
    const historyButtons = screen.getAllByRole("button", {
      name: "Histórico",
    });

    fireEvent.click(historyButtons[0]);
    expect(await screen.findByText(/R\$ 100,00/)).toBeInTheDocument();

    fireEvent.click(historyButtons[1]);

    expect(screen.getByText("Carregando manutenções...")).toBeInTheDocument();
    expect(screen.queryByText(/R\$ 100,00/)).not.toBeInTheDocument();
    expect(
      await screen.findByText("Falha ao consultar as manutenções."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/R\$ 100,00/)).not.toBeInTheDocument();
  });
});
