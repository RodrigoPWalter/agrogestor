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
            <span>Área total prevista</span>
            <strong>{formatNumber(planting.plannedAreaHectares)} ha</strong>
          </div>
          <div>
            <span>Talhão ou área</span>
            <strong>{planting.fieldName || "Não informado"}</strong>
          </div>
          <div>
            <span>Variedade planejada</span>
            <strong>{planting.seedVariety}</strong>
          </div>
          <div>
            <span>Distância entre linhas</span>
            <strong>
              {planting.rowSpacingCentimeters != null
                ? `${formatNumber(planting.rowSpacingCentimeters)} cm`
                : "Não informado"}
            </strong>
          </div>
          <div>
            <span>Início do ciclo</span>
            <strong>{formatDate(planting.startDate)}</strong>
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
