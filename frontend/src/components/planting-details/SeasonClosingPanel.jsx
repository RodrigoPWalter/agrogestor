import { BarChart3, TrendingUp } from "lucide-react";
import { formatCurrency, formatNumber } from "../../utils/formatters";

export function SeasonClosingPanel({
  closing,
  salePrice,
  loading,
  onSalePriceChange,
  onSubmit,
}) {
  return (
    <section className="season-closing-panel">
      <div className="section-heading">
        <div>
          <h3>
            <BarChart3 size={17} /> Fechamento de safra
          </h3>
          <p>Custo total vs. produção registrada no diário de colheita.</p>
        </div>
      </div>

      <div className="season-closing-grid">
        <div>
          <span>Custo total</span>
          <strong>{formatCurrency(closing.totalExpenses)}</strong>
        </div>
        <div>
          <span>Custo por hectare</span>
          <strong>{formatCurrency(closing.expensePerHectare)}</strong>
        </div>
        <div>
          <span>Produção registrada</span>
          <strong>
            {formatNumber(closing.mainHarvestQuantity, 3)}{" "}
            {closing.mainHarvestUnit || "un."}
          </strong>
        </div>
        <div
          className={
            Number(closing.estimatedResult || 0) < 0
              ? "season-closing-result season-closing-result--negative"
              : "season-closing-result"
          }
        >
          <span>Resultado estimado</span>
          <strong>
            {closing.revenueEstimated
              ? formatCurrency(closing.estimatedResult)
              : "Informe o preço"}
          </strong>
        </div>
      </div>

      <form className="season-price-form" onSubmit={onSubmit}>
        <label>
          <span>Preço recebido por {closing.mainHarvestUnit || "un."}</span>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Ex.: 70,00"
            value={salePrice}
            onChange={onSalePriceChange}
          />
        </label>
        <button className="button button--primary" disabled={loading}>
          <TrendingUp size={17} />{" "}
          {loading ? "Calculando..." : "Atualizar resultado"}
        </button>
      </form>

      {closing.harvestTotals.length === 0 ? (
        <p className="muted-copy">
          Ainda não há colheita registrada no diário para este plantio.
        </p>
      ) : closing.harvestTotals.length > 1 ? (
        <div className="season-harvest-list">
          {closing.harvestTotals.map((item) => (
            <span key={item.unit || "sem-unidade"}>
              {formatNumber(item.quantity, 3)} {item.unit || "un."}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
