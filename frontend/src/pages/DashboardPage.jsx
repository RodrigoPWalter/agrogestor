import { LoaderCircle, Plus, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { CommodityQuotesPanel } from "../components/dashboard/CommodityQuotesPanel";
import { DashboardMetrics } from "../components/dashboard/DashboardMetrics";
import { DashboardQuickActions } from "../components/dashboard/DashboardQuickActions";
import {
  InventoryAttentionPanel,
  RecentExpensesPanel,
  RecentPlantingsPanel,
} from "../components/dashboard/DashboardTables";
import { ErrorBanner } from "../components/Feedback";
import { PageHeader } from "../components/PageHeader";
import {
  getDashboardCacheKey,
  isSameLocalDay,
  readDashboardCache,
  writeDashboardCache,
} from "../utils/dashboardCache";

export function DashboardPage() {
  const [dashboardCacheKey] = useState(() => getDashboardCacheKey());
  const [cachedDashboard] = useState(() =>
    readDashboardCache(dashboardCacheKey),
  );
  const [plantings, setPlantings] = useState(
    () => cachedDashboard?.plantings ?? [],
  );
  const [expenses, setExpenses] = useState(
    () => cachedDashboard?.expenses ?? [],
  );
  const [inventoryProducts, setInventoryProducts] = useState(
    () => cachedDashboard?.inventoryProducts ?? [],
  );
  const [loading, setLoading] = useState(() => !cachedDashboard);
  const [usingCache, setUsingCache] = useState(() => Boolean(cachedDashboard));
  const [error, setError] = useState("");
  const [commodityQuotes, setCommodityQuotes] = useState(
    () => cachedDashboard?.commodityQuotes ?? null,
  );
  const [quotesLoading, setQuotesLoading] = useState(
    () => !cachedDashboard?.commodityQuotes,
  );
  const [quotesError, setQuotesError] = useState("");

  useEffect(() => {
    Promise.all([
      api.getPlantings(),
      api.getExpenses(),
      api.getInventoryProducts(),
    ])
      .then(([plantingPage, expensePage, products]) => {
        const nextPlantings = plantingPage.content;
        const nextExpenses = expensePage.content;
        const nextInventoryProducts = products;

        setPlantings(nextPlantings);
        setExpenses(nextExpenses);
        setInventoryProducts(nextInventoryProducts);
        setUsingCache(false);
        writeDashboardCache(
          {
            plantings: nextPlantings,
            expenses: nextExpenses,
            inventoryProducts: nextInventoryProducts,
          },
          dashboardCacheKey,
        );
      })
      .catch((requestError) => {
        setError(
          cachedDashboard
            ? "Mostrando os últimos dados salvos. O servidor pode estar acordando."
            : requestError.message,
        );
      })
      .finally(() => setLoading(false));
  }, [cachedDashboard, dashboardCacheKey]);

  function loadCommodityQuotes({ force = false } = {}) {
    const currentCache = readDashboardCache(dashboardCacheKey);
    const cachedQuotes = currentCache?.commodityQuotes;

    if (
      !force &&
      cachedQuotes &&
      isSameLocalDay(currentCache?.commodityQuotesSavedAt)
    ) {
      setCommodityQuotes(cachedQuotes);
      setQuotesLoading(false);
      return;
    }

    setQuotesLoading(!cachedQuotes);
    setQuotesError("");
    api
      .getCommodityQuotes()
      .then((quotes) => {
        setCommodityQuotes(quotes);
        writeDashboardCache(
          {
            commodityQuotes: quotes,
            commodityQuotesSavedAt: new Date().toISOString(),
          },
          dashboardCacheKey,
        );
      })
      .catch((requestError) => {
        if (cachedQuotes) {
          setCommodityQuotes(cachedQuotes);
          setQuotesError(
            "Cotações antigas salvas. Tentaremos atualizar depois.",
          );
          return;
        }

        setQuotesError(requestError.message);
      })
      .finally(() => setQuotesLoading(false));
  }

  useEffect(() => {
    loadCommodityQuotes();
  }, [dashboardCacheKey]);

  const metrics = useMemo(() => {
    const hectares = plantings.reduce(
      (total, planting) => total + Number(planting.plantedAreaHectares),
      0,
    );
    const totalExpenses = expenses.reduce(
      (total, expense) => total + Number(expense.amount),
      0,
    );
    const lowStockProducts = inventoryProducts.filter(
      (product) => product.lowStock,
    ).length;

    return {
      hectares,
      totalExpenses,
      costPerHectare: hectares > 0 ? totalExpenses / hectares : 0,
      inventoryCount: inventoryProducts.length,
      lowStockProducts,
    };
  }, [plantings, expenses, inventoryProducts]);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Resumo operacional"
        title="Visão geral da propriedade"
        description="Indicadores consolidados da safra, custos e estoque para a operação diária."
        action={
          <Link className="button button--primary" to="/plantios">
            <Plus size={18} /> Novo plantio
          </Link>
        }
      />

      <ErrorBanner message={error} onDismiss={() => setError("")} />

      {(loading || usingCache) && (
        <section className="connection-note" aria-live="polite">
          <LoaderCircle className={loading ? "spin" : ""} size={18} />
          <div>
            <strong>
              {loading ? "Acordando o servidor..." : "Dados salvos no aparelho"}
            </strong>
            <span>
              {loading
                ? "O painel já está disponível enquanto buscamos os dados mais recentes."
                : "Assim que a conexão responder, o AgroGestor atualiza os números automaticamente."}
            </span>
          </div>
        </section>
      )}

      <DashboardMetrics
        metrics={metrics}
        activePlantingsCount={plantings.length}
        expensesCount={expenses.length}
      />

      <div className="dashboard-grid dashboard-grid--balanced">
        <DashboardQuickActions />
        <InventoryAttentionPanel inventoryProducts={inventoryProducts} />
      </div>

      <CommodityQuotesPanel
        commodityQuotes={commodityQuotes}
        quotesError={quotesError}
        quotesLoading={quotesLoading}
        onRetry={() => loadCommodityQuotes({ force: true })}
      />

      <div className="dashboard-grid">
        <RecentPlantingsPanel plantings={plantings} />
        <RecentExpensesPanel expenses={expenses} />
      </div>

      <section className="tip-banner">
        <span>
          <TrendingUp size={23} />
        </span>
        <div>
          <strong>Dica do AgroGestor</strong>
          <p>
            Registre os gastos e movimentações de estoque no mesmo dia. Isso
            deixa os números da safra bem mais confiáveis.
          </p>
        </div>
      </section>
    </div>
  );
}
