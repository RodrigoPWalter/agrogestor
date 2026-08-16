import { CheckCircle2, Clock3, Edit3, Plus, Trash2, Wheat } from "lucide-react";
import { formatDate, formatNumber } from "../../utils/formatters";
import { PlantingProgressBar } from "../plantings/PlantingProgressBar";

const KILOGRAM_FACTORS = {
  BAGS_60_KG: 60,
  KILOGRAMS: 1,
  TONNES: 1000,
};

function summarizeProduction(steps) {
  const totals = new Map();
  let kilograms = 0;

  steps.forEach((step) => {
    const unitName = step.harvestUnitName || step.harvestUnit;
    totals.set(
      unitName,
      (totals.get(unitName) || 0) + Number(step.harvestQuantity),
    );
    kilograms +=
      Number(step.harvestQuantity) * (KILOGRAM_FACTORS[step.harvestUnit] || 0);
  });

  return {
    totals: [...totals.entries()].map(([unit, quantity]) => ({
      unit,
      quantity,
    })),
    kilograms,
  };
}

function harvestProgressFromSteps(planting, steps, plantingSteps) {
  const plantedArea = Array.isArray(plantingSteps)
    ? plantingSteps.reduce(
        (total, step) => total + Number(step.plantedAreaHectares),
        0,
      )
    : Number(planting.plantedAreaHectares) || 0;
  const harvestedArea = steps.reduce(
    (total, step) => total + Number(step.harvestedAreaHectares),
    0,
  );
  const remainingArea = Math.max(0, plantedArea - harvestedArea);
  const percentage =
    plantedArea > 0
      ? Math.round(Math.min(100, (harvestedArea / plantedArea) * 100) * 100) /
        100
      : 0;
  const statusName =
    harvestedArea === 0
      ? "Não iniciada"
      : harvestedArea >= plantedArea
        ? "Área totalmente colhida"
        : "Em andamento";
  const production = summarizeProduction(steps);
  const bagsPerHectare =
    harvestedArea > 0 ? production.kilograms / 60 / harvestedArea : 0;

  return {
    plantedArea,
    harvestedArea,
    remainingArea,
    percentage,
    statusName,
    productionTotals: production.totals,
    bagsPerHectare,
  };
}

function formatTimeRange(step) {
  if (!step.startTime && !step.endTime) return null;
  if (step.startTime && step.endTime) {
    return `${step.startTime.slice(0, 5)} às ${step.endTime.slice(0, 5)}`;
  }
  return step.startTime
    ? `Início às ${step.startTime.slice(0, 5)}`
    : `Término às ${step.endTime.slice(0, 5)}`;
}

function productionText(totals) {
  if (totals.length === 0) return "Ainda não registrada";
  return totals
    .map((item) => `${formatNumber(item.quantity, 3)} ${item.unit || "un."}`)
    .join(" + ");
}

export function HarvestProgressSection({
  planting,
  steps,
  plantingSteps,
  form,
  formOpen,
  editing,
  saving,
  today,
  onFormChange,
  onCreate,
  onEdit,
  onCancel,
  onSubmit,
  onDelete,
  onFinish,
}) {
  const progress = harvestProgressFromSteps(planting, steps, plantingSteps);
  const editableArea = editing
    ? progress.remainingArea + Number(editing.harvestedAreaHectares)
    : progress.remainingArea;
  const canAdd =
    planting.status === "ACTIVE" &&
    progress.plantedArea > 0 &&
    progress.remainingArea > 0 &&
    !formOpen;

  function update(field, value) {
    onFormChange({ ...form, [field]: value });
  }

  return (
    <section className="planting-progress-section harvest-progress-section">
      <div className="planting-progress-section__header">
        <div>
          <span className="eyebrow">Execução da colheita</span>
          <h3>Progresso da colheita</h3>
        </div>
        {canAdd && (
          <button
            type="button"
            className="button button--primary"
            onClick={onCreate}
          >
            <Plus size={17} /> Registrar colheita
          </button>
        )}
      </div>

      <div className="planting-progress-summary">
        <div>
          <span>Área plantada</span>
          <strong>{formatNumber(progress.plantedArea)} ha</strong>
        </div>
        <div>
          <span>Já colhida</span>
          <strong>{formatNumber(progress.harvestedArea)} ha</strong>
        </div>
        <div>
          <span>Restante</span>
          <strong>{formatNumber(progress.remainingArea)} ha</strong>
        </div>
      </div>

      <PlantingProgressBar
        percentage={progress.percentage}
        statusName={progress.statusName}
        ariaLabel="Progresso da área colhida"
      />

      <div className="harvest-production-summary">
        <div>
          <span>Produção acumulada</span>
          <strong>{productionText(progress.productionTotals)}</strong>
        </div>
        <div>
          <span>Produtividade média</span>
          <strong>
            {progress.harvestedArea > 0
              ? `${formatNumber(progress.bagsPerHectare, 2)} sc/ha`
              : "—"}
          </strong>
        </div>
      </div>

      {progress.remainingArea === 0 &&
        progress.plantedArea > 0 &&
        planting.status === "ACTIVE" && (
          <div className="planting-progress-complete harvest-complete">
            <CheckCircle2 size={18} />
            <span>
              Toda a área plantada foi colhida. Confirme o encerramento para
              enviar esta safra ao histórico.
            </span>
            <button
              type="button"
              className="button button--primary"
              onClick={() => onFinish(planting)}
            >
              Finalizar safra
            </button>
          </div>
        )}

      {formOpen && (
        <form className="planting-step-form" onSubmit={onSubmit}>
          <div className="planting-step-form__header">
            <strong>
              {editing ? "Editar etapa de colheita" : "Colheita do dia"}
            </strong>
            <small>
              É possível informar até {formatNumber(editableArea)} ha nesta
              etapa.
            </small>
          </div>
          <div className="form-grid">
            <label>
              <span>Data</span>
              <input
                required
                type="date"
                min={planting.startDate}
                max={today}
                value={form.harvestDate}
                onChange={(event) => update("harvestDate", event.target.value)}
              />
            </label>
            <label>
              <span>Área colhida nesta etapa (ha)</span>
              <input
                required
                type="number"
                min="0.01"
                max={editableArea}
                step="0.01"
                inputMode="decimal"
                value={form.harvestedAreaHectares}
                onChange={(event) =>
                  update("harvestedAreaHectares", event.target.value)
                }
              />
            </label>
            <label>
              <span>Quantidade produzida</span>
              <input
                required
                type="number"
                min="0.001"
                step="0.001"
                inputMode="decimal"
                value={form.harvestQuantity}
                onChange={(event) =>
                  update("harvestQuantity", event.target.value)
                }
                placeholder={
                  form.harvestUnit === "BAGS_60_KG" ? "Ex.: 640" : "Ex.: 38400"
                }
              />
            </label>
            <label>
              <span>Unidade da produção</span>
              <select
                required
                value={form.harvestUnit}
                onChange={(event) => update("harvestUnit", event.target.value)}
              >
                <option value="BAGS_60_KG">Sacas de 60 kg</option>
                <option value="KILOGRAMS">Quilogramas</option>
                <option value="TONNES">Toneladas</option>
              </select>
            </label>
            <label>
              <span>Variedade colhida</span>
              <input
                required
                maxLength="120"
                value={form.seedVariety}
                onChange={(event) => update("seedVariety", event.target.value)}
                placeholder="Ex.: AG 8700"
              />
            </label>
            <label>
              <span>Horário de início (opcional)</span>
              <input
                type="time"
                value={form.startTime}
                onChange={(event) => update("startTime", event.target.value)}
              />
            </label>
            <label>
              <span>Horário de término (opcional)</span>
              <input
                type="time"
                min={form.startTime || undefined}
                value={form.endTime}
                onChange={(event) => update("endTime", event.target.value)}
              />
            </label>
            <label className="form-grid__full">
              <span>Observações (opcional)</span>
              <textarea
                rows="3"
                maxLength="1000"
                value={form.observations}
                onChange={(event) => update("observations", event.target.value)}
                placeholder="Ex.: Colheita interrompida devido à umidade"
              />
            </label>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="button button--ghost"
              onClick={onCancel}
            >
              Cancelar
            </button>
            <button className="button button--primary" disabled={saving}>
              {saving
                ? "Salvando..."
                : editing
                  ? "Salvar etapa"
                  : "Registrar colheita"}
            </button>
          </div>
        </form>
      )}

      <div className="planting-step-history">
        <div className="planting-step-history__title">
          <strong>Etapas da colheita</strong>
          <span>{steps.length} lançamentos</span>
        </div>
        {steps.length === 0 ? (
          <div className="planting-step-empty">
            <Wheat size={20} />
            <span>
              {progress.plantedArea === 0
                ? "Registre os hectares plantados antes de iniciar a colheita."
                : planting.status === "HARVESTED"
                  ? "Esta safra foi finalizada antes do acompanhamento da colheita por etapas."
                  : "A colheita ainda não começou."}
            </span>
          </div>
        ) : (
          <div className="planting-step-timeline harvest-step-timeline">
            {steps.map((step) => {
              const timeRange = formatTimeRange(step);
              return (
                <article key={step.id}>
                  <span className="planting-step-timeline__marker" />
                  <div>
                    <header>
                      <div>
                        <strong>{formatDate(step.harvestDate)}</strong>
                        <span>
                          {formatNumber(step.harvestedAreaHectares)} ha colhidos
                        </span>
                        <span>
                          Produção: {formatNumber(step.harvestQuantity, 3)}{" "}
                          {step.harvestUnitName}
                        </span>
                        <span>Variedade: {step.seedVariety}</span>
                      </div>
                      {planting.status === "ACTIVE" && (
                        <div className="card-actions">
                          <button
                            type="button"
                            className="icon-button"
                            onClick={() => onEdit(step)}
                            aria-label="Editar etapa de colheita"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            type="button"
                            className="icon-button icon-button--danger"
                            onClick={() => onDelete(step)}
                            aria-label="Excluir etapa de colheita"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </header>
                    {timeRange && (
                      <small>
                        <Clock3 size={14} /> {timeRange}
                      </small>
                    )}
                    {step.observations && <p>{step.observations}</p>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
