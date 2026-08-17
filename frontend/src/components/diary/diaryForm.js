import { toInputDate } from "../../utils/formatters";

export const diaryActivityTypes = [
  { value: "PLANTING", label: "Etapa de plantio" },
  { value: "RAIN", label: "Chuva" },
  { value: "PRODUCT_PURCHASE", label: "Compra de produto" },
  { value: "PRODUCT_USE", label: "Uso de produto" },
  { value: "MAINTENANCE", label: "Manutenção" },
  { value: "OBSERVATION", label: "Observação" },
  { value: "HARVEST", label: "Etapa de colheita" },
  { value: "SALE", label: "Venda da produção" },
  { value: "OTHER", label: "Outro" },
];

export function newDiaryForm(plantingId = "") {
  return {
    plantingId,
    entryDate: toInputDate(),
    activityType: "OBSERVATION",
    activity: "",
    weatherCondition: "",
    appliedProducts: "",
    products: [],
    observations: "",
    rainfallMillimeters: "",
    productId: "",
    productName: "",
    productType: "PESTICIDE",
    quantity: "",
    unit: "LITER",
    supplier: "",
    amount: "",
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
  };
}
