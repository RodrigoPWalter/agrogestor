import { api } from "../api/client";

let preparationPromise = null;

export function prepareOfflineData() {
  if (navigator.onLine === false) {
    return Promise.resolve({ prepared: 0, failed: 0 });
  }
  if (preparationPromise) return preparationPromise;

  const requestGroups = [
    [
      () => api.getDashboardSummary(),
      () => api.getAllPlantings(),
      () => api.getPlantings(),
      () => api.getPlantingHistory(),
      () => api.getPlantingExpenseSummaries("ACTIVE"),
      () => api.getPlantingExpenseSummaries("HARVESTED"),
    ],
    [
      () => api.getInventoryProducts(),
      () => api.getMachines(),
      () => api.getDiaryEntries(),
      () => api.getExpenses(),
    ],
    [
      () => api.getPropertyExpenses(),
      () => api.getPropertyExpenseSummary(),
      () => api.getRainfall(),
      () => api.getRainfallSummary(),
    ],
  ];

  preparationPromise = requestGroups
    .reduce(
      (previous, group) =>
        previous.then(async (results) => [
          ...results,
          ...(await Promise.allSettled(group.map((request) => request()))),
        ]),
      Promise.resolve([]),
    )
    .then((results) => ({
      prepared: results.filter((result) => result.status === "fulfilled")
        .length,
      failed: results.filter((result) => result.status === "rejected").length,
    }))
    .finally(() => {
      preparationPromise = null;
    });

  return preparationPromise;
}
