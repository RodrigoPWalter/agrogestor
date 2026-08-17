import {
  CircleDollarSign,
  Search,
  ShoppingCart,
  Warehouse,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import {
  EmptyState,
  ErrorBanner,
  InlineErrorState,
  LoadingState,
  OfflineDataState,
} from "../components/Feedback";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { ProductionSalesSection } from "../components/production/ProductionSalesSection";
import { useLatestRequestGuard } from "../hooks/useLatestRequestGuard";
import { useOfflineRefresh } from "../hooks/useOfflineRefresh";
import { formatCurrency, formatNumber } from "../utils/formatters";

export function ProductionPage() {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offlineDataUnavailable, setOfflineDataUnavailable] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [selectedData, setSelectedData] = useState(null);
  const [selectedLoading, setSelectedLoading] = useState(false);
  const [selectedError, setSelectedError] = useState("");
  const beginSelectedRequest = useLatestRequestGuard();

  async function loadStock({ showLoading = true } = {}) {
    if (showLoading) setLoading(true);
    try {
      setStock(await api.getProductionStock());
      setOfflineDataUnavailable(false);
      setError("");
    } catch (requestError) {
      setOfflineDataUnavailable(Boolean(requestError.offlineCacheMiss));
      setError(requestError.offlineCacheMiss ? "" : requestError.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  useEffect(() => {
    loadStock();
  }, []);
  useOfflineRefresh(() => loadStock({ showLoading: false }));

  const filteredStock = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    if (!term) return stock;
    return stock.filter((item) =>
      [item.crop, item.harvest, item.fieldName]
        .filter(Boolean)
        .some((value) => value.toLocaleLowerCase("pt-BR").includes(term)),
    );
  }, [search, stock]);

  const summary = useMemo(
    () => ({
      crops: stock.length,
      sales: stock.reduce((total, item) => total + item.saleCount, 0),
      revenue: stock.reduce((total, item) => total + Number(item.revenue), 0),
      withBalance: stock.filter((item) => Number(item.availableBags) > 0)
        .length,
    }),
    [stock],
  );

  async function loadSelected(item, { showLoading = true } = {}) {
    const isCurrent = beginSelectedRequest();
    if (showLoading) setSelectedLoading(true);
    setSelectedError("");
    try {
      const [plantingStock, sales] = await Promise.all([
        api.getPlantingProductionStock(item.plantingId),
        api.getProductionSales(item.plantingId),
      ]);
      if (isCurrent()) setSelectedData({ stock: plantingStock, sales });
    } catch (requestError) {
      if (isCurrent()) setSelectedError(requestError.message);
    } finally {
      if (isCurrent() && showLoading) setSelectedLoading(false);
    }
  }

  function openSales(item) {
    setSelected(item);
    setSelectedData(null);
    void loadSelected(item);
  }

  function closeSales() {
    beginSelectedRequest();
    setSelected(null);
    setSelectedData(null);
  }

  async function refreshAfterSale() {
    await Promise.all([
      loadSelected(selected, { showLoading: false }),
      loadStock({ showLoading: false }),
    ]);
  }

  return (
    <div className="page production-page">
      <PageHeader
        eyebrow="Colheita e comercialização"
        title="Produção"
        description="Acompanhe o que foi colhido, o que já foi vendido e o saldo disponível."
      />
      <ErrorBanner message={error} onDismiss={() => setError("")} />

      {!offlineDataUnavailable && (
        <div className="production-summary-strip">
          <article>
            <Warehouse size={20} />
            <div>
              <span>Safras com produção</span>
              <strong>{summary.crops}</strong>
            </div>
          </article>
          <article>
            <ShoppingCart size={20} />
            <div>
              <span>Vendas registradas</span>
              <strong>{summary.sales}</strong>
            </div>
          </article>
          <article>
            <CircleDollarSign size={20} />
            <div>
              <span>Faturamento realizado</span>
              <strong>{formatCurrency(summary.revenue)}</strong>
            </div>
          </article>
          <article>
            <Warehouse size={20} />
            <div>
              <span>Safras com saldo</span>
              <strong>{summary.withBalance}</strong>
            </div>
          </article>
        </div>
      )}

      {offlineDataUnavailable ? (
        <OfflineDataState onRetry={() => loadStock()} />
      ) : loading ? (
        <LoadingState label="Conferindo a produção..." />
      ) : stock.length === 0 ? (
        <EmptyState
          title="Nenhuma produção colhida"
          description="Quando uma etapa de colheita for registrada, o saldo aparecerá aqui automaticamente."
        />
      ) : (
        <section className="production-stock-panel">
          <div className="production-stock-toolbar">
            <div>
              <span className="eyebrow">Estoque da produção</span>
              <h2>Saldos por safra</h2>
            </div>
            <label className="search-box production-search">
              <Search size={18} />
              <input
                type="search"
                placeholder="Buscar cultura, safra ou talhão"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>

          {filteredStock.length === 0 ? (
            <EmptyState
              title="Nenhum saldo encontrado"
              description="Tente pesquisar por outro nome de cultura, safra ou talhão."
            />
          ) : (
            <div className="data-table-wrapper production-stock-table-wrapper">
              <table className="data-table production-stock-table">
                <thead>
                  <tr>
                    <th>Cultura / safra</th>
                    <th>Talhão</th>
                    <th className="number-column">Colhido</th>
                    <th className="number-column">Vendido</th>
                    <th className="number-column">Saldo</th>
                    <th className="number-column">Faturamento</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStock.map((item) => (
                    <tr key={item.plantingId}>
                      <td data-label="Cultura / safra">
                        <strong>{item.crop}</strong>
                        <small>Safra {item.harvest}</small>
                      </td>
                      <td data-label="Talhão">
                        {item.fieldName || "Não informado"}
                      </td>
                      <td data-label="Colhido" className="number-column">
                        {formatNumber(item.harvestedBags, 3)} sc
                      </td>
                      <td data-label="Vendido" className="number-column">
                        {formatNumber(item.soldBags, 3)} sc
                      </td>
                      <td
                        data-label="Saldo"
                        className="number-column production-balance-value"
                      >
                        {formatNumber(item.availableBags, 3)} sc
                      </td>
                      <td data-label="Faturamento" className="number-column">
                        {formatCurrency(item.revenue)}
                      </td>
                      <td>
                        <button
                          className="button button--ghost"
                          type="button"
                          onClick={() => openSales(item)}
                        >
                          Gerenciar vendas
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {selected && (
        <Modal
          title={`Vendas — ${selected.crop}`}
          description={`Safra ${selected.harvest}${selected.fieldName ? ` · ${selected.fieldName}` : ""}`}
          onClose={closeSales}
          dismissible={!selectedLoading}
          size="wide"
        >
          <div className="production-sales-modal-content">
            {selectedLoading && !selectedData ? (
              <LoadingState label="Carregando vendas..." />
            ) : selectedError && !selectedData ? (
              <InlineErrorState
                message={selectedError}
                onRetry={() => loadSelected(selected)}
              />
            ) : selectedData ? (
              <ProductionSalesSection
                stock={selectedData.stock}
                sales={selectedData.sales}
                onChanged={refreshAfterSale}
              />
            ) : null}
          </div>
        </Modal>
      )}
    </div>
  );
}
