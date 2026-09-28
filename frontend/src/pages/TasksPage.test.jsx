import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client";
import { TasksPage } from "./TasksPage";

vi.mock("../api/client", () => ({
  api: {
    getTasks: vi.fn(),
    getAllPlantings: vi.fn(),
    getMachines: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    updateTaskStatus: vi.fn(),
    deleteTask: vi.fn(),
  },
}));

const task = {
  id: "task-1",
  title: "Consertar a plantadeira",
  category: "MACHINE",
  categoryLabel: "Máquina",
  status: "PENDING",
  statusLabel: "Pendente",
  urgency: "ATTENTION",
  urgencyLabel: "Atenção",
  dueDate: "2026-10-15",
  estimatedDurationMinutes: 480,
  machineId: "machine-1",
  machineLabel: "John Deere 6110J",
  notes: "Trocar o rolamento",
};

describe("TasksPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getTasks.mockResolvedValue({ content: [task] });
    api.getAllPlantings.mockResolvedValue({ content: [] });
    api.getMachines.mockResolvedValue([]);
  });

  it("mostra prazo, urgência e tempo estimado da tarefa", async () => {
    render(<TasksPage />);

    expect(await screen.findByText("Consertar a plantadeira")).toBeVisible();
    expect(screen.getByText("Atenção")).toBeVisible();
    expect(screen.getByText("1 dia de trabalho")).toBeVisible();
    expect(screen.getByText("John Deere 6110J")).toBeVisible();
  });

  it("cadastra uma tarefa com o tempo convertido para minutos", async () => {
    api.createTask.mockResolvedValue({ id: "task-2" });
    render(<TasksPage />);

    await screen.findByText("Consertar a plantadeira");
    fireEvent.click(screen.getByRole("button", { name: "Nova tarefa" }));
    fireEvent.change(screen.getByLabelText("O que precisa ser feito?"), {
      target: { value: "Buscar peças da semeadora" },
    });
    fireEvent.change(screen.getByLabelText("Tempo estimado"), {
      target: { value: "2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar tarefa" }));

    await waitFor(() =>
      expect(api.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Buscar peças da semeadora",
          estimatedDurationMinutes: 120,
        }),
      ),
    );
  });

  it("permite iniciar uma tarefa pendente", async () => {
    api.updateTaskStatus.mockResolvedValue({ ...task, status: "IN_PROGRESS" });
    render(<TasksPage />);

    fireEvent.click(await screen.findByRole("button", { name: "Iniciar" }));

    await waitFor(() =>
      expect(api.updateTaskStatus).toHaveBeenCalledWith(task.id, "IN_PROGRESS"),
    );
  });
});
