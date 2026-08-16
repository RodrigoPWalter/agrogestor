import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import { useOfflineRefresh } from "./useOfflineRefresh";

const sectionRequests = (plantingId) => [
  ["resumo financeiro", () => api.getExpenseSummary(plantingId)],
  ["gastos", () => api.getExpenses(plantingId)],
  ["diário", () => api.getDiaryEntries(plantingId)],
  ["chuvas", () => api.getRainfallByPlanting(plantingId)],
  ["fechamento da safra", () => api.getSeasonClosing(plantingId)],
  ["progresso do plantio", () => api.getPlantingSteps(plantingId)],
  ["progresso da colheita", () => api.getHarvestSteps(plantingId)],
  ["estoque", () => api.getInventoryProducts()],
];

export function usePlantingDetailsData(plantingId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    const sections = sectionRequests(plantingId);

    try {
      const results = await Promise.allSettled(
        sections.map(([, request]) => request()),
      );
      const fulfilledCount = results.filter(
        ({ status }) => status === "fulfilled",
      ).length;
      const failedSections = results
        .map((result, index) =>
          result.status === "rejected" ? sections[index][0] : null,
        )
        .filter(Boolean);

      if (fulfilledCount === 0) {
        setData(null);
        setLoadError(
          "Não foi possível carregar o plantio. Verifique a conexão e tente novamente.",
        );
        return;
      }

      setData((current) => {
        const valueOr = (index, fallback) =>
          results[index].status === "fulfilled"
            ? results[index].value
            : fallback;
        const expenses = valueOr(1, { content: current?.expenses ?? [] });
        const diary = valueOr(2, { content: current?.diary ?? [] });

        return {
          summary: valueOr(0, current?.summary ?? null),
          expenses: expenses.content,
          diary: diary.content,
          rainfall: valueOr(3, current?.rainfall ?? []),
          closing: valueOr(4, current?.closing ?? null),
          steps: valueOr(5, current?.steps ?? []),
          harvestSteps: valueOr(6, current?.harvestSteps ?? []),
          inventoryProducts: valueOr(7, current?.inventoryProducts ?? []),
        };
      });

      if (failedSections.length > 0) {
        setLoadError(
          `O plantio foi aberto, mas não foi possível atualizar: ${failedSections.join(", ")}.`,
        );
      }
    } finally {
      setLoading(false);
    }
  }, [plantingId]);

  useEffect(() => {
    load();
  }, [load]);
  useOfflineRefresh(load);

  return { data, setData, loading, loadError, load };
}
