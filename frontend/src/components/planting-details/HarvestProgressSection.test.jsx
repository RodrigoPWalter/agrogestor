import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HarvestProgressSection } from "./HarvestProgressSection";

const planting = {
  id: "planting-1",
  plantedAreaHectares: 20,
  startDate: "2026-01-10",
  seedVariety: "AG 8700",
  status: "ACTIVE",
};

const form = {
  harvestDate: "2026-07-30",
  harvestedAreaHectares: "",
  harvestQuantity: "",
  harvestUnit: "BAGS_60_KG",
  seedVariety: "AG 8700",
  startTime: "",
  endTime: "",
  observations: "",
};

describe("HarvestProgressSection", () => {
  it("calcula área, produção e produtividade pelas etapas", () => {
    render(
      <HarvestProgressSection
        planting={planting}
        steps={[
          {
            id: "harvest-1",
            harvestDate: "2026-07-29",
            harvestedAreaHectares: 5,
            harvestQuantity: 400,
            harvestUnit: "BAGS_60_KG",
            harvestUnitName: "sacas de 60 kg",
            seedVariety: "AG 8700",
          },
          {
            id: "harvest-2",
            harvestDate: "2026-07-30",
            harvestedAreaHectares: 5,
            harvestQuantity: 24000,
            harvestUnit: "KILOGRAMS",
            harvestUnitName: "kg",
            seedVariety: "AG 8700",
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
        onFinish={vi.fn()}
      />,
    );

    expect(screen.getAllByText("10 ha")).toHaveLength(2);
    expect(
      screen.getByText("400 sacas de 60 kg + 24.000 kg"),
    ).toBeInTheDocument();
    expect(screen.getByText("80 sc/ha")).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", {
        name: "Progresso da área colhida",
      }),
    ).toHaveAttribute("aria-valuenow", "50");
  });
});
