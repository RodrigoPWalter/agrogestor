import { CircleDollarSign, Gauge, LandPlot, Warehouse } from "lucide-react";
import { formatCurrency, formatNumber } from "../../utils/formatters";

export function DashboardMetrics({ metrics }) {
  return (
    <section className="metric-grid" aria-label="Indicadores principais">
      <article className="metric-card metric-card--green">
        <span className="metric-card__icon">
          <LandPlot size={22} />
        </span>
        <div>
          <small>Área plantada</small>
          <strong>{formatNumber(metrics.plantedAreaHectares)} ha</strong>
          <span>
            {metrics.activePlantingsCount}{" "}
            {metrics.activePlantingsCount === 1
              ? "plantio ativo"
              : "plantios ativos"}
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
          <span>{metrics.expenseCount} lançamentos</span>
        </div>
      </article>

      <article className="metric-card metric-card--blue">
        <span className="metric-card__icon">
          <Warehouse size={22} />
        </span>
        <div>
          <small>Produtos em estoque</small>
          <strong>{metrics.inventoryProductCount}</strong>
          <span>
            {metrics.lowStockProductCount}{" "}
            {metrics.lowStockProductCount === 1
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
          <span>Considerando a área prevista ativa</span>
        </div>
      </article>
    </section>
  );
}
