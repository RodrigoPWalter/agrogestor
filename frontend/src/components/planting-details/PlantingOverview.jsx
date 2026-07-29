import {
  formatCurrency,
  formatDate,
  formatNumber,
} from "../../utils/formatters";

export function PlantingOverview({ planting, summary, expenseCount }) {
  return (
    <>
      <section>
        <h3>Resumo do plantio</h3>
        <div className="compact-list">
          <div>
            <span>Área plantada</span>
            <strong>{formatNumber(planting.plantedAreaHectares)} ha</strong>
          </div>
          <div>
            <span>Variedade</span>
            <strong>{planting.seedVariety}</strong>
          </div>
          <div>
            <span>Data do plantio</span>
            <strong>{formatDate(planting.plantingDate)}</strong>
          </div>
        </div>
      </section>
      <section>
        <h3>Resumo financeiro</h3>
        <div className="planting-detail__summary">
          <div>
            <span>Total gasto</span>
            <strong>{formatCurrency(summary.totalExpenses)}</strong>
          </div>
          <div>
            <span>Custo por hectare</span>
            <strong>{formatCurrency(summary.expensePerHectare)}</strong>
          </div>
          <div>
            <span>Lançamentos</span>
            <strong>{summary.expenseCount ?? expenseCount}</strong>
          </div>
        </div>
      </section>
    </>
  );
}
