import { formatNumber } from "../../utils/formatters";

export function ExpensesHeader({
  plantings,
  scope,
  selectedPlantingId,
  onScopeChange,
  onPlantingChange,
}) {
  return (
    <header className="expenses-page-header">
      <div className="expenses-page-heading">
        <span className="eyebrow">Controle financeiro</span>
        <h1>Gastos</h1>
        <p>Acompanhe os custos das safras e da propriedade em um só lugar.</p>
      </div>

      <div className="expenses-header-controls">
        <div
          className="expenses-scope-tabs"
          role="tablist"
          aria-label="Tipo de gasto"
        >
          <button
            type="button"
            role="tab"
            aria-selected={scope === "planting"}
            className={scope === "planting" ? "is-active" : ""}
            onClick={() => onScopeChange("planting")}
          >
            Por plantio
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={scope === "property"}
            className={scope === "property" ? "is-active" : ""}
            onClick={() => onScopeChange("property")}
          >
            Da propriedade
          </button>
        </div>

        {scope === "planting" && plantings.length > 0 && (
          <label className="expenses-context-selector">
            <span>Gastos do plantio:</span>
            <select value={selectedPlantingId} onChange={onPlantingChange}>
              {plantings.map((planting) => (
                <option key={planting.id} value={planting.id}>
                  {planting.crop} — {planting.harvest} ·{" "}
                  {formatNumber(planting.plannedAreaHectares)} ha previstos
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </header>
  );
}
