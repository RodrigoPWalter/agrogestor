import {
  CheckCircle2,
  Clock3,
  Edit3,
  Plus,
  Sprout,
  Trash2,
} from "lucide-react";
import { formatDate, formatNumber } from "../../utils/formatters";
import { PlantingProgressBar } from "../plantings/PlantingProgressBar";

function progressFromSteps(planting, steps) {
  const plantedArea = steps.reduce(
    (total, step) => total + Number(step.plantedAreaHectares),
    0,
  );
  const plannedArea = Number(planting.plannedAreaHectares);
  const remainingArea = Math.max(0, plannedArea - plantedArea);
  const percentage =
    plannedArea > 0
      ? Math.round(Math.min(100, (plantedArea / plannedArea) * 100) * 100) / 100
      : 0;
  const statusName =
    plantedArea === 0
      ? "Não iniciado"
      : plantedArea >= plannedArea
        ? "Área totalmente plantada"
        : "Em andamento";

  return { plantedArea, plannedArea, remainingArea, percentage, statusName };
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

export function PlantingProgressSection({
  planting,
  steps,
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
}) {
  const progress = progressFromSteps(planting, steps);
  const editableArea = editing
    ? progress.remainingArea + Number(editing.plantedAreaHectares)
    : progress.remainingArea;
  const canAdd =
    planting.status === "ACTIVE" && progress.remainingArea > 0 && !formOpen;

  function update(field, value) {
    onFormChange({ ...form, [field]: value });
  }

  return (
    <section className="planting-progress-section">
      <div className="planting-progress-section__header">
        <div>
          <span className="eyebrow">Execução da semeadura</span>
          <h3>Progresso do plantio</h3>
        </div>
        {canAdd && (
          <button
            type="button"
            className="button button--primary"
            onClick={onCreate}
          >
            <Plus size={17} /> Adicionar hectares
          </button>
        )}
      </div>

      <div className="planting-progress-summary">
        <div>
          <span>Área prevista</span>
          <strong>{formatNumber(progress.plannedArea)} ha</strong>
        </div>
        <div>
          <span>Já plantada</span>
          <strong>{formatNumber(progress.plantedArea)} ha</strong>
        </div>
        <div>
          <span>Restante</span>
          <strong>{formatNumber(progress.remainingArea)} ha</strong>
        </div>
      </div>

      <PlantingProgressBar
        percentage={progress.percentage}
        statusName={progress.statusName}
      />

      {progress.remainingArea === 0 && planting.status === "ACTIVE" && (
        <div className="planting-progress-complete" role="status">
          <CheckCircle2 size={18} />
          <span>
            Toda a área prevista foi plantada. O ciclo continua ativo para os
            demais registros da safra.
          </span>
        </div>
      )}

      {formOpen && (
        <form className="planting-step-form" onSubmit={onSubmit}>
          <div className="planting-step-form__header">
            <strong>
              {editing ? "Editar etapa de plantio" : "Nova etapa de plantio"}
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
                value={form.stepDate}
                onChange={(event) => update("stepDate", event.target.value)}
              />
            </label>
            <label>
              <span>Área plantada nesta etapa (ha)</span>
              <input
                required
                type="number"
                min="0.01"
                max={editableArea}
                step="0.01"
                inputMode="decimal"
                value={form.plantedAreaHectares}
                onChange={(event) =>
                  update("plantedAreaHectares", event.target.value)
                }
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
                placeholder="Ex.: Trabalho interrompido devido à chuva"
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
              {saving ? "Salvando..." : editing ? "Salvar etapa" : "Adicionar"}
            </button>
          </div>
        </form>
      )}

      <div className="planting-step-history">
        <div className="planting-step-history__title">
          <strong>Etapas registradas</strong>
          <span>{steps.length} lançamentos</span>
        </div>
        {steps.length === 0 ? (
          <div className="planting-step-empty">
            <Sprout size={20} />
            <span>
              A semeadura ainda não começou. Os gastos de preparação já podem
              ser registrados normalmente.
            </span>
          </div>
        ) : (
          <div className="planting-step-timeline">
            {steps.map((step) => {
              const timeRange = formatTimeRange(step);
              return (
                <article key={step.id}>
                  <span className="planting-step-timeline__marker" />
                  <div>
                    <header>
                      <div>
                        <strong>{formatDate(step.stepDate)}</strong>
                        <span>
                          {formatNumber(step.plantedAreaHectares)} ha plantados
                        </span>
                      </div>
                      {planting.status === "ACTIVE" && (
                        <div className="card-actions">
                          <button
                            type="button"
                            className="icon-button"
                            onClick={() => onEdit(step)}
                            aria-label="Editar etapa de plantio"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            type="button"
                            className="icon-button icon-button--danger"
                            onClick={() => onDelete(step)}
                            aria-label="Excluir etapa de plantio"
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
