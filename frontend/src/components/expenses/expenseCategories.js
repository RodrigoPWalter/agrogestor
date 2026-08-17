export const expenseCategories = [
  { value: "SEEDS", label: "Sementes" },
  { value: "FERTILIZERS", label: "Fertilizantes" },
  { value: "PESTICIDES", label: "Defensivos" },
  { value: "FUEL", label: "Combustível" },
  { value: "MAINTENANCE", label: "Manutenção" },
  { value: "LABOR", label: "Mão de obra" },
  { value: "OTHER", label: "Outros" },
];

export function expenseCategoryLabel(value) {
  return (
    expenseCategories.find((category) => category.value === value)?.label ||
    value
  );
}
