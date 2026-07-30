export function buildPlantingExpenseSummaries(plantings, expenses) {
  const totals = expenses.reduce((byPlanting, expense) => {
    const current = byPlanting.get(expense.plantingId) ?? {
      totalExpenses: 0,
      expenseCount: 0,
    };
    current.totalExpenses += Number(expense.amount);
    current.expenseCount += 1;
    byPlanting.set(expense.plantingId, current);
    return byPlanting;
  }, new Map());

  return Object.fromEntries(
    plantings.map((planting) => {
      const summary = totals.get(planting.id) ?? {
        totalExpenses: 0,
        expenseCount: 0,
      };
      const area = Number(planting.plannedAreaHectares);

      return [
        planting.id,
        {
          ...summary,
          expensePerHectare: area > 0 ? summary.totalExpenses / area : 0,
        },
      ];
    }),
  );
}
