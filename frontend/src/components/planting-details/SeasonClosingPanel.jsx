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
          <p>
            Compare os custos com as vendas realizadas e projete o saldo que
            ainda está disponível.
          </p>
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
          <span>Produção colhida</span>
          <strong>
            {formatNumber(closing.mainHarvestQuantity, 3)}{" "}
            {closing.mainHarvestUnit || "un."}
          </strong>
        </div>
        <div>
          <span>Faturamento realizado</span>
          <strong>{formatCurrency(closing.actualRevenue)}</strong>
        </div>
        <div>
          <span>Preço médio vendido</span>
          <strong>
            {closing.saleCount > 0
              ? `${formatCurrency(closing.averageSalePrice)} / sc`
              : "Sem vendas"}
          </strong>
        </div>
        <div
          className={
            Number(closing.actualResult || 0) < 0
              ? "season-closing-result season-closing-result--negative"
              : "season-closing-result"
          }
        >
          <span>Resultado realizado</span>
          <strong>
            {closing.saleCount > 0
              ? formatCurrency(closing.actualResult)
              : "Sem vendas"}
          </strong>
        </div>
        <div>
          <span>Saldo para vender</span>
          <strong>{formatNumber(closing.availableQuantity, 3)} sc</strong>
        </div>
        <div
          className={
            Number(closing.estimatedResult || 0) < 0
              ? "season-closing-result season-closing-result--negative"
              : "season-closing-result"
          }
        >
          <span>Resultado projetado</span>
          <strong>
            {closing.revenueEstimated
              ? formatCurrency(closing.estimatedResult)
              : "Informe uma projeção"}
          </strong>
        </div>
      </div>

      {Number(closing.availableQuantity || 0) > 0 && (
        <form className="season-price-form" onSubmit={onSubmit}>
          <label>
            <span>Preço projetado para o saldo (saca de 60 kg)</span>
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              placeholder="Ex.: 70,00"
              value={salePrice}
              onChange={onSalePriceChange}
            />
          </label>
          <button className="button button--primary" disabled={loading}>
            <TrendingUp size={17} />{" "}
            {loading ? "Salvando..." : "Atualizar projeção"}
          </button>
        </form>
      )}

      {closing.salePricePerUnit && (
        <p className="muted-copy" role="status">
          Projeção salva: {formatCurrency(closing.salePricePerUnit)} por saca de
          60 kg do saldo ainda não vendido.
        </p>
      )}

      {closing.harvestTotals.length === 0 ? (
        <p className="muted-copy">
          Ainda não há colheita registrada para este plantio.
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
