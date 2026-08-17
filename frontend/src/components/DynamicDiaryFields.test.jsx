import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { DynamicDiaryFields } from "./DynamicDiaryFields";

const activityTypes = [
  { value: "OBSERVATION", label: "Observação" },
  { value: "RAIN", label: "Chuva" },
  { value: "PRODUCT_PURCHASE", label: "Compra de produto" },
  { value: "PRODUCT_USE", label: "Uso de produto" },
  { value: "EXPENSE", label: "Gasto" },
  { value: "PLANTING", label: "Etapa de plantio" },
  { value: "HARVEST", label: "Etapa de colheita" },
  { value: "SALE", label: "Venda da produção" },
];

const initialForm = {
  activityType: "OBSERVATION",
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
  expenseCategory: "OTHER",
  machineId: "",
  operationAreaHectares: "",
  operationSeedVariety: "",
  operationStartTime: "",
  operationEndTime: "",
  harvestQuantity: "",
  harvestUnit: "BAGS_60_KG",
  saleQuantityBags: "",
  salePricePerBag: "",
  buyer: "",
  activity: "",
  weatherCondition: "",
  observations: "",
};

function DiaryFieldsHarness({
  plantings = [],
  products = [],
  initialState = initialForm,
}) {
  const [form, setForm] = useState(initialState);
  return (
    <DynamicDiaryFields
      form={form}
      setForm={setForm}
      plantings={plantings}
      products={products}
      machines={[]}
      activityTypes={activityTypes}
      today="2026-07-29"
    />
  );
}

describe("DynamicDiaryFields", () => {
  it("mostra somente os campos relacionados ao tipo escolhido", () => {
    render(<DiaryFieldsHarness />);

    expect(screen.getByLabelText("Observação")).toBeRequired();

    fireEvent.change(screen.getByLabelText("Tipo de acontecimento"), {
      target: { value: "RAIN" },
    });

    expect(screen.getByText("Quantidade de chuva (mm)")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Tipo de acontecimento"), {
      target: { value: "PRODUCT_PURCHASE" },
    });

    expect(screen.getByText("Nome do novo produto")).toBeInTheDocument();
    expect(screen.getByText("Quantidade comprada")).toBeInTheDocument();
    expect(screen.getByText("Valor pago (opcional)")).toBeInTheDocument();
  });

  it("pede hectares nas etapas de plantio e colheita", () => {
    render(<DiaryFieldsHarness />);

    fireEvent.change(screen.getByLabelText("Tipo de acontecimento"), {
      target: { value: "PLANTING" },
    });
    expect(
      screen.getByLabelText("Hectares plantados nesta etapa"),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Tipo de acontecimento"), {
      target: { value: "HARVEST" },
    });
    expect(
      screen.getByLabelText("Hectares colhidos nesta etapa"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Quantidade colhida")).toBeInTheDocument();
  });

  it("mostra quantidade, preço e comprador para venda da produção", () => {
    render(<DiaryFieldsHarness />);

    fireEvent.change(screen.getByLabelText("Tipo de acontecimento"), {
      target: { value: "SALE" },
    });

    expect(
      screen.getByLabelText("Quantidade vendida (sacas de 60 kg)"),
    ).toBeRequired();
    expect(screen.getByLabelText("Preço por saca (R$)")).toBeRequired();
    expect(screen.getByLabelText("Comprador (opcional)")).toBeInTheDocument();
    expect(screen.getByLabelText("Plantio (obrigatório)")).toBeInTheDocument();
  });

  it("mostra os campos financeiros para um gasto geral ou do plantio", () => {
    render(<DiaryFieldsHarness />);

    fireEvent.change(screen.getByLabelText("Tipo de acontecimento"), {
      target: { value: "EXPENSE" },
    });

    expect(screen.getByLabelText("Descrição do gasto")).toBeRequired();
    expect(screen.getByLabelText("Categoria")).toBeRequired();
    expect(screen.getByLabelText("Valor do gasto (R$)")).toBeRequired();
    expect(screen.getByLabelText("Plantio (opcional)")).toBeInTheDocument();
  });

  it("mantém produto zerado disponível para compra, mas não para uso", () => {
    const products = [
      {
        id: "product-zero",
        name: "Ureia",
        quantity: 0,
        unitName: "kg",
      },
    ];
    render(<DiaryFieldsHarness products={products} />);

    fireEvent.change(screen.getByLabelText("Tipo de acontecimento"), {
      target: { value: "PRODUCT_PURCHASE" },
    });
    expect(
      within(screen.getByLabelText("Produto")).getByText("Ureia — saldo 0 kg"),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Tipo de acontecimento"), {
      target: { value: "PRODUCT_USE" },
    });
    expect(
      within(screen.getByLabelText("Produto")).queryByText(
        "Ureia — saldo 0 kg",
      ),
    ).not.toBeInTheDocument();
  });

  it("oculta plantios sem área restante para a operação escolhida", () => {
    const plantings = [
      {
        id: "planting-in-progress",
        crop: "Trigo",
        harvest: "2026",
        plannedAreaHectares: 12,
        plantedAreaHectares: 5,
        remainingAreaHectares: 7,
        harvestedAreaHectares: 2,
        harvestRemainingAreaHectares: 3,
      },
      {
        id: "planting-complete",
        crop: "Soja",
        harvest: "2026",
        plannedAreaHectares: 70,
        plantedAreaHectares: 70,
        remainingAreaHectares: 0,
        harvestedAreaHectares: 70,
        harvestRemainingAreaHectares: 0,
      },
    ];
    render(<DiaryFieldsHarness plantings={plantings} />);

    fireEvent.change(screen.getByLabelText("Tipo de acontecimento"), {
      target: { value: "PLANTING" },
    });
    let plantingSelect = screen.getByLabelText("Plantio (obrigatório)");
    expect(
      within(plantingSelect).getByText("Trigo — 2026"),
    ).toBeInTheDocument();
    expect(
      within(plantingSelect).queryByText("Soja — 2026"),
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Tipo de acontecimento"), {
      target: { value: "HARVEST" },
    });
    plantingSelect = screen.getByLabelText("Plantio (obrigatório)");
    expect(
      within(plantingSelect).getByText("Trigo — 2026"),
    ).toBeInTheDocument();
    expect(
      within(plantingSelect).queryByText("Soja — 2026"),
    ).not.toBeInTheDocument();
  });
});
