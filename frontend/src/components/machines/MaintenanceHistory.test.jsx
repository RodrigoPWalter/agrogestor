import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MaintenanceHistory } from "./MaintenanceHistory";

describe("MaintenanceHistory", () => {
  it("mantém manutenção do Diário visível sem ações duplicadas", () => {
    render(
      <MaintenanceHistory
        machine={{ brand: "John Deere", model: "6110J" }}
        maintenances={[
          {
            id: "maintenance-1",
            maintenanceType: "CORRECTIVE",
            maintenanceTypeName: "Corretiva",
            maintenanceDate: "2026-08-10",
            cost: 200,
            replacedParts: "Filtro de óleo",
            nextReviewHours: 500,
            diaryManaged: true,
          },
        ]}
        onCreate={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Registrada no Diário")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Editar manutenção" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Excluir manutenção" }),
    ).not.toBeInTheDocument();
  });
});
