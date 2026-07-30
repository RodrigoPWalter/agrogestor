import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PlantingProgressSection } from "./PlantingProgressSection";

const planting = {
  id: "planting-1",
  plannedAreaHectares: 30,
  startDate: "2026-07-01",
  status: "ACTIVE",
};

const form = {
  stepDate: "2026-07-30",
  plantedAreaHectares: "",
  startTime: "",
  endTime: "",
  observations: "",
};

describe("PlantingProgressSection", () => {
  it("calcula o progresso pela soma das etapas", () => {
    render(
      <PlantingProgressSection
        planting={planting}
        steps={[
          {
            id: "step-1",
            stepDate: "2026-07-29",
            plantedAreaHectares: 5,
          },
          {
            id: "step-2",
            stepDate: "2026-07-30",
            plantedAreaHectares: 10,
          },
        ]}
        form={form}
        formOpen={false}
        editing={null}
        saving={false}
        today="2026-07-30"
        onFormChange={vi.fn()}
        onCreate={vi.fn()}
        onEdit={vi.fn()}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getAllByText("15 ha")).toHaveLength(2);
    expect(screen.getByText("Em andamento")).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", {
        name: "Progresso da área plantada",
      }),
    ).toHaveAttribute("aria-valuenow", "50");
  });
});
