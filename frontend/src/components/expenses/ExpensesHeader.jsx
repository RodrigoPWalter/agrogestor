import { formatNumber } from "../../utils/formatters";

export function ExpensesHeader({
  plantings,
  selectedPlantingId,
  onPlantingChange,
}) {
  return (
    <header className="expenses-page-header">
      <div>
        <span className="eyebrow">Controle financeiro</span>
        <h1>Gastos por plantio</h1>
        <p>Acompanhe os lançamentos e o custo consolidado de cada operação.</p>
      </div>
      {plantings.length > 0 && (
        <label className="expenses-context-selector">
          <span>Gastos do plantio:</span>
          <select value={selectedPlantingId} onChange={onPlantingChange}>
            {plantings.map((planting) => (
              <option key={planting.id} value={planting.id}>
                {planting.crop} — {planting.harvest} ·{" "}
                {formatNumber(planting.plantedAreaHectares)} ha
              </option>
            ))}
          </select>
        </label>
      )}
    </header>
  );
}
