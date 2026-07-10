import {
  ArrowRight,
  BookOpenText,
  CircleDollarSign,
  ExternalLink,
  Gauge,
  LandPlot,
  LoaderCircle,
  Plus,
  RefreshCw,
  ReceiptText,
  Sprout,
  TrendingUp,
  Warehouse,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { ErrorBanner } from "../components/Feedback";
import { PageHeader } from "../components/PageHeader";
import { formatCurrency, formatDate, formatNumber } from "../utils/formatters";

const DASHBOARD_CACHE_KEY = "agrogestor:dashboard-cache:v1";

function readDashboardCache() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawCache = window.localStorage.getItem(DASHBOARD_CACHE_KEY);
    return rawCache ? JSON.parse(rawCache) : null;
  } catch {
    return null;
  }
}

function writeDashboardCache(nextCache) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const currentCache = readDashboardCache() ?? {};
    window.localStorage.setItem(
      DASHBOARD_CACHE_KEY,
      JSON.stringify({
        ...currentCache,
        ...nextCache,
        savedAt: new Date().toISOString(),
      }),
    );
  } catch {
    // Se o celular estiver sem espaço para salvar cache, o app segue online.
  }
}

function isSameLocalDay(dateValue) {
  if (!dateValue) {
    return false;
  }

  const checkedDate = new Date(dateValue);
  const today = new Date();

  return (
    checkedDate.getFullYear() === today.getFullYear() &&
    checkedDate.getMonth() === today.getMonth() &&
    checkedDate.getDate() === today.getDate()
  );
}

export function DashboardPage() {
  const [cachedDashboard] = useState(() => readDashboardCache());
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
        setInventoryProducts(products);
        setUsingCache(false);
        writeDashboardCache({
          plantings: nextPlantings,
          expenses: nextExpenses,
          inventoryProducts: nextInventoryProducts,
        });
      })
      .catch((requestError) => {
        setError(
          cachedDashboard
            ? "Mostrando os últimos dados salvos. O servidor pode estar acordando."
            : requestError.message,
        );
      })
      .finally(() => setLoading(false));
  }, [cachedDashboard]);

  function loadCommodityQuotes({ force = false } = {}) {
    const currentCache = readDashboardCache();
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
        writeDashboardCache({
          commodityQuotes: quotes,
          commodityQuotesSavedAt: new Date().toISOString(),
        });
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
  }, []);

  const metrics = useMemo(() => {
    const hectares = plantings.reduce(
      (total, planting) => total + Number(planting.plantedAreaHectares),
      0,
    );
    const totalExpenses = expenses.reduce(
      (total, expense) => total + Number(expense.amount),
      0,
    );
    const costPerHectare = hectares > 0 ? totalExpenses / hectares : 0;
    const lowStockProducts = inventoryProducts.filter(
      (product) => product.lowStock,
    ).length;

    return {
      hectares,
      totalExpenses,
      costPerHectare,
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

      <ErrorBanner message={error} />

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

      <section className="metric-grid" aria-label="Indicadores principais">
        <article className="metric-card metric-card--green">
          <span className="metric-card__icon">
            <LandPlot size={22} />
          </span>
          <div>
            <small>Área plantada</small>
            <strong>{formatNumber(metrics.hectares)} ha</strong>
            <span>
              {plantings.length}{" "}
              {plantings.length === 1 ? "plantio ativo" : "plantios ativos"}
            </span>
          </div>
        </article>

        <article className="metric-card metric-card--gold">
          <span className="metric-card__icon">
            <CircleDollarSign size={22} />
          </span>
          <div>
            <small>Gastos registrados</small>
            <strong>{formatCurrency(metrics.totalExpenses)}</strong>
            <span>{expenses.length} lançamentos</span>
          </div>
        </article>

        <article className="metric-card metric-card--blue">
          <span className="metric-card__icon">
            <Warehouse size={22} />
          </span>
          <div>
            <small>Produtos em estoque</small>
            <strong>{metrics.inventoryCount}</strong>
            <span>
              {metrics.lowStockProducts}{" "}
              {metrics.lowStockProducts === 1
                ? "alerta de estoque"
                : "alertas de estoque"}
            </span>
          </div>
        </article>

        <article className="metric-card metric-card--neutral">
          <span className="metric-card__icon">
            <Gauge size={22} />
          </span>
          <div>
            <small>Custo médio por hectare</small>
            <strong>{formatCurrency(metrics.costPerHectare)}</strong>
            <span>Considerando a área ativa</span>
          </div>
        </article>
      </section>

      <div className="dashboard-grid dashboard-grid--balanced">
        <section className="panel">
          <div className="panel__header">
            <div>
              <span className="eyebrow">Acesso rápido</span>
              <h2>Atalhos de trabalho</h2>
            </div>
          </div>
          <div className="quick-actions">
            <Link to="/plantios" className="quick-action">
              <span className="quick-action__icon quick-action__icon--green">
                <Sprout />
              </span>
              <div>
                <strong>Gerenciar plantios</strong>
                <small>Cadastre e acompanhe as safras</small>
              </div>
              <ArrowRight size={19} />
            </Link>

            <Link to="/gastos" className="quick-action">
              <span className="quick-action__icon quick-action__icon--blue">
                <ReceiptText />
              </span>
              <div>
                <strong>Registrar gasto</strong>
                <small>Controle custos por plantio</small>
              </div>
              <ArrowRight size={19} />
            </Link>

            <Link to="/estoque" className="quick-action">
              <span className="quick-action__icon quick-action__icon--gold">
                <Warehouse />
              </span>
              <div>
                <strong>Atualizar estoque</strong>
                <small>Acompanhe entradas e baixas de produtos</small>
              </div>
              <ArrowRight size={19} />
            </Link>

            <Link to="/diario" className="quick-action">
              <span className="quick-action__icon quick-action__icon--green">
                <BookOpenText />
              </span>
              <div>
                <strong>Atualizar diário</strong>
                <small>Registre acontecimentos da propriedade</small>
              </div>
              <ArrowRight size={19} />
            </Link>
          </div>
        </section>

        <section className="panel">
          <div className="panel__header">
            <div>
              <span className="eyebrow">Controle de insumos</span>
              <h2>Estoque em atenção</h2>
            </div>
            <Link to="/estoque" className="text-link">
              Ver estoque
            </Link>
          </div>

          {inventoryProducts.length === 0 ? (
            <div className="compact-empty">
              <Warehouse size={28} />
              <p>Nenhum produto cadastrado ainda.</p>
            </div>
          ) : (
            <div className="data-table-wrapper">
              <table className="data-table dashboard-inventory-table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Tipo</th>
                    <th>Saldo</th>
                    <th>Validade</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryProducts.slice(0, 5).map((product) => (
                    <tr key={product.id}>
                      <td>
                        <span className="table-primary">{product.name}</span>
                      </td>
                      <td>{product.type}</td>
                      <td className="numeric-value">
                        {formatNumber(product.quantity, 3)} {product.unitName}
                      </td>
                      <td>
                        {product.expirationDate
                          ? formatDate(product.expirationDate)
                          : "Sem data"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section
        className="panel quotation-panel"
        aria-labelledby="quotation-title"
      >
        <div className="panel__header quotation-panel__header">
          <div>
            <span className="eyebrow">Mercado agrícola</span>
            <h2 id="quotation-title">Cotações e variação de mercado</h2>
          </div>
          {commodityQuotes && (
            <a
              className="text-link quotation-source"
              href={commodityQuotes.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              Fonte: {commodityQuotes.sourceName} <ExternalLink size={14} />
            </a>
          )}
        </div>

        {quotesLoading ? (
          <div className="quotation-status">
            <LoaderCircle className="spin" size={20} />
            Atualizando cotações...
          </div>
        ) : quotesError ? (
          <div className="quotation-status quotation-status--error">
            <span>{quotesError}</span>
            <button
              className="button button--ghost"
              type="button"
              onClick={() => loadCommodityQuotes({ force: true })}
            >
              <RefreshCw size={16} /> Tentar novamente
            </button>
          </div>
        ) : (
          <>
            <div className="quotation-grid">
              {commodityQuotes.quotes.map((quote) => (
                <article className="quotation-card" key={quote.commodity}>
                  <span className="quotation-card__crop">
                    {quote.commodity.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <small>{quote.commodity}</small>
                    <strong>{formatCurrency(quote.price)}</strong>
                    <span>Valor divulgado</span>
                  </div>
                </article>
              ))}
            </div>
            <p className="quotation-note">
              Cotação de {formatDate(commodityQuotes.quotationDate)}.
              {commodityQuotes.stale &&
                " Exibindo a última atualização disponível."}
            </p>
            {commodityQuotes.history?.length > 1 && (
              <div className="quotation-history">
                <h3>Histórico recente</h3>
                <div>
                  <table>
                    <thead>
                      <tr>
                        <th>Data</th>
                        {commodityQuotes.quotes.map((quote) => (
                          <th key={quote.commodity}>{quote.commodity}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {commodityQuotes.history.slice(0, 7).map((day) => (
                        <tr key={day.quotationDate}>
                          <td>{formatDate(day.quotationDate)}</td>
                          {commodityQuotes.quotes.map((quote) => {
                            const value = day.quotes.find(
                              (item) => item.commodity === quote.commodity,
                            );
                            return (
                              <td key={quote.commodity}>
                                {value ? formatCurrency(value.price) : "—"}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel__header">
            <div>
              <span className="eyebrow">Mais recentes</span>
              <h2>Últimos plantios</h2>
            </div>
            <Link to="/plantios" className="text-link">
              Ver todos
            </Link>
          </div>

          {plantings.length === 0 ? (
            <div className="compact-empty">
              <Sprout size={28} />
              <p>Nenhum plantio cadastrado ainda.</p>
            </div>
          ) : (
            <div className="data-table-wrapper">
              <table className="data-table dashboard-planting-table">
                <thead>
                  <tr>
                    <th>Cultura</th>
                    <th>Safra</th>
                    <th>Área</th>
                    <th>Plantio</th>
                  </tr>
                </thead>
                <tbody>
                  {plantings.slice(0, 5).map((planting) => (
                    <tr key={planting.id}>
                      <td>
                        <span className="table-primary">{planting.crop}</span>
                        <small>{planting.seedVariety}</small>
                      </td>
                      <td>{planting.harvest}</td>
                      <td className="numeric-value">
                        {formatNumber(planting.plantedAreaHectares)} ha
                      </td>
                      <td>{formatDate(planting.plantingDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel__header">
            <div>
              <span className="eyebrow">Finanças</span>
              <h2>Últimos gastos</h2>
            </div>
            <Link to="/gastos" className="text-link">
              Ver gastos
            </Link>
          </div>

          {expenses.length === 0 ? (
            <div className="compact-empty">
              <ReceiptText size={28} />
              <p>Nenhum gasto registrado ainda.</p>
            </div>
          ) : (
            <div className="data-table-wrapper">
              <table className="data-table dashboard-expense-table">
                <thead>
                  <tr>
                    <th>Descrição</th>
                    <th>Categoria</th>
                    <th>Data</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.slice(0, 5).map((expense) => (
                    <tr key={expense.id}>
                      <td>
                        <span className="table-primary">
                          {expense.description}
                        </span>
                      </td>
                      <td>{expense.category}</td>
                      <td>{formatDate(expense.expenseDate)}</td>
                      <td className="numeric-value">
                        {formatCurrency(expense.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
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
