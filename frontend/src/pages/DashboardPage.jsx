import { LoaderCircle, Plus, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { CommodityQuotesPanel } from "../components/dashboard/CommodityQuotesPanel";
import { DashboardMetrics } from "../components/dashboard/DashboardMetrics";
import { DashboardQuickActions } from "../components/dashboard/DashboardQuickActions";
import {
  InventoryAttentionPanel,
  RecentExpensesPanel,
  RecentPlantingsPanel,
} from "../components/dashboard/DashboardTables";
import { DiaryQuickLaunch } from "../components/diary/DiaryQuickLaunch";
import { ErrorBanner, OfflineDataState } from "../components/Feedback";
import { PageHeader } from "../components/PageHeader";
import { useOfflineRefresh } from "../hooks/useOfflineRefresh";
import {
  getDashboardCacheKey,
  isSameLocalDay,
  readDashboardCache,
  writeDashboardCache,
} from "../utils/dashboardCache";

const emptySummary = {
  metrics: {
    plantedAreaHectares: 0,
    plannedAreaHectares: 0,
    activePlantingsCount: 0,
    totalExpenses: 0,
    expenseCount: 0,
    inventoryProductCount: 0,
    lowStockProductCount: 0,
    costPerHectare: 0,
  },
  recentPlantings: [],
  recentExpenses: [],
  inventoryProducts: [],
};

export function DashboardPage() {
  const navigate = useNavigate();
  const [dashboardCacheKey] = useState(() => getDashboardCacheKey());
  const [cachedDashboard] = useState(() =>
    readDashboardCache(dashboardCacheKey),
  );
  const [summary, setSummary] = useState(
    () => cachedDashboard?.summary ?? emptySummary,
  );
  const [loading, setLoading] = useState(() => !cachedDashboard?.summary);
  const [usingCache, setUsingCache] = useState(() =>
    Boolean(cachedDashboard?.summary),
  );
  const [error, setError] = useState("");
  const [offlineDataUnavailable, setOfflineDataUnavailable] = useState(false);
  const [commodityQuotes, setCommodityQuotes] = useState(
    () => cachedDashboard?.commodityQuotes ?? null,
  );
  const [quotesLoading, setQuotesLoading] = useState(
    () => !cachedDashboard?.commodityQuotes,
  );
  const [quotesError, setQuotesError] = useState("");

  const loadDashboard = useCallback(() => {
    api
      .getDashboardSummary()
      .then((nextSummary) => {
        setSummary(nextSummary);
        setUsingCache(false);
        setOfflineDataUnavailable(false);
        writeDashboardCache({ summary: nextSummary }, dashboardCacheKey);
      })
      .catch((requestError) => {
        setOfflineDataUnavailable(
          Boolean(requestError.offlineCacheMiss && !cachedDashboard?.summary),
        );
        setError(
          cachedDashboard
            ? "Mostrando os últimos dados salvos. O servidor pode estar acordando."
            : requestError.offlineCacheMiss
              ? ""
              : requestError.message,
        );
      })
      .finally(() => setLoading(false));
  }, [cachedDashboard, dashboardCacheKey]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useOfflineRefresh(loadDashboard);

  const loadCommodityQuotes = useCallback(
    ({ force = false } = {}) => {
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
    },
    [dashboardCacheKey],
  );

  useEffect(() => {
    if (loading) return;

    loadCommodityQuotes();
  }, [loadCommodityQuotes, loading]);

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

      {!offlineDataUnavailable && (loading || usingCache) && (
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

      {offlineDataUnavailable ? (
        <OfflineDataState onRetry={() => window.location.reload()} />
      ) : (
        <>
          <DashboardMetrics metrics={summary.metrics} />

          <DiaryQuickLaunch
            onSelect={(activityType) =>
              navigate(`/diario?new=${encodeURIComponent(activityType)}`)
            }
            onMore={() => navigate("/diario?new=more")}
          />

          <div className="dashboard-grid dashboard-grid--balanced">
            <DashboardQuickActions />
            <InventoryAttentionPanel
              inventoryProducts={summary.inventoryProducts}
            />
          </div>

          <CommodityQuotesPanel
            commodityQuotes={commodityQuotes}
            quotesError={quotesError}
            quotesLoading={quotesLoading}
            onRetry={() => loadCommodityQuotes({ force: true })}
          />

          <div className="dashboard-grid">
            <RecentPlantingsPanel plantings={summary.recentPlantings} />
            <RecentExpensesPanel expenses={summary.recentExpenses} />
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
        </>
      )}
    </div>
  );
}
