import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { DynamicDiaryFields } from "./DynamicDiaryFields";

const activityTypes = [
  { value: "INSPECTION", label: "Vistoria" },
  { value: "RAIN", label: "Chuva" },
  { value: "PRODUCT_PURCHASE", label: "Compra de produto" },
];

const initialForm = {
  activityType: "INSPECTION",
  entryDate: "2026-07-29",
  plantingId: "",
  rainfallMillimeters: "",
  productId: "",
  productName: "",
  productType: "PESTICIDE",
  quantity: "",
  unit: "LITER",
  supplier: "",
  amount: "",
  machineId: "",
  harvestQuantity: "",
  harvestUnit: "Sacas",
  activity: "",
  weatherCondition: "",
  observations: "",
};

function DiaryFieldsHarness() {
  const [form, setForm] = useState(initialForm);
  return (
    <DynamicDiaryFields
      form={form}
      setForm={setForm}
      plantings={[]}
      products={[]}
      machines={[]}
      activityTypes={activityTypes}
      today="2026-07-29"
    />
  );
}

describe("DynamicDiaryFields", () => {
  it("mostra somente os campos relacionados ao tipo escolhido", () => {
    render(<DiaryFieldsHarness />);

    expect(screen.getByText("O que foi vistoriado")).toBeInTheDocument();
    expect(
      screen.getByText("Condição do tempo (opcional)"),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Tipo de acontecimento"), {
      target: { value: "RAIN" },
    });

    expect(screen.getByText("Quantidade de chuva (mm)")).toBeInTheDocument();
    expect(screen.queryByText("O que foi vistoriado")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Tipo de acontecimento"), {
      target: { value: "PRODUCT_PURCHASE" },
    });

    expect(screen.getByText("Nome do novo produto")).toBeInTheDocument();
    expect(screen.getByText("Quantidade comprada")).toBeInTheDocument();
    expect(screen.getByText("Valor pago (opcional)")).toBeInTheDocument();
  });
});
