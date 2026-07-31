import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Edit3,
  History,
  Sprout,
  Trash2,
} from "lucide-react";
import { formatDate, formatNumber } from "../../utils/formatters";
import { PlantingSummaryCard } from "../PlantingSummaryCard";
import { PlantingProgressBar } from "./PlantingProgressBar";

export function PlantingList({
  plantings,
  summaries,
  view,
  onOpen,
  onEdit,
  onDelete,
  onFinish,
  onReactivate,
}) {
  return (
    <div className="data-card-grid">
      {plantings.map((planting) => (
        <article key={planting.id} className="data-card">
          <div className="data-card__header">
            <span className="crop-avatar crop-avatar--large">
              <Sprout size={22} />
            </span>
            <div>
              <h2>{planting.crop}</h2>
              <span className="badge">{planting.harvest}</span>
            </div>
            <div className="card-actions">
              {view === "active" &&
                planting.harvestProgressStatus === "COMPLETED" && (
                  <button
                    className="icon-button icon-button--success"
                    onClick={() => onFinish(planting)}
                    aria-label="Finalizar safra"
                  >
                    <CheckCircle2 size={18} />
                  </button>
                )}
              {view === "history" && (
                <button
                  className="icon-button icon-button--success"
                  onClick={() => onReactivate(planting)}
                  aria-label="Reativar plantio"
                >
                  <History size={18} />
                </button>
              )}
              <button
                className="icon-button"
                onClick={() => onEdit(planting)}
                aria-label="Editar plantio"
              >
                <Edit3 size={18} />
              </button>
              <button
                className="icon-button icon-button--danger"
                onClick={() => onDelete(planting)}
                aria-label="Excluir plantio"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
          <div className="data-card__metric">
            <strong>
              {formatNumber(planting.plantedAreaHectares)} de{" "}
              {formatNumber(planting.plannedAreaHectares)} ha
            </strong>
            <span>Progresso da área prevista</span>
          </div>
          <span className="planting-progress-label">Semeadura</span>
          <PlantingProgressBar
            compact
            percentage={planting.plantedPercentage}
            statusName={planting.plantingProgressStatusName}
          />
          {Number(planting.plantedAreaHectares) > 0 && (
            <>
              <span className="planting-progress-label">
                Colheita: {formatNumber(planting.harvestedAreaHectares)} de{" "}
                {formatNumber(planting.plantedAreaHectares)} ha
              </span>
              <PlantingProgressBar
                compact
                percentage={planting.harvestedPercentage}
                statusName={planting.harvestProgressStatusName}
                ariaLabel="Progresso da área colhida"
              />
            </>
          )}
          <PlantingSummaryCard summary={summaries[planting.id]} />
          <dl className="details-list">
            {planting.completedAt && (
              <div>
                <dt>Finalizado</dt>
                <dd>{formatDate(planting.completedAt.slice(0, 10))}</dd>
              </div>
            )}
            {planting.fieldName && (
              <div>
                <dt>Talhão ou área</dt>
                <dd>{planting.fieldName}</dd>
              </div>
            )}
            {planting.rowSpacingCentimeters != null && (
              <div>
                <dt>Entre linhas</dt>
                <dd>{formatNumber(planting.rowSpacingCentimeters)} cm</dd>
              </div>
            )}
            <div>
              <dt>Variedade planejada</dt>
              <dd>{planting.seedVariety}</dd>
            </div>
            <div>
              <dt>Taxa de semeadura</dt>
              <dd>
                {formatNumber(planting.seedRate ?? planting.seedQuantity, 3)}{" "}
                {planting.seedRateUnitName || "unidade não informada"}
              </dd>
            </div>
            <div>
              <dt>
                <CalendarDays size={15} /> Data
              </dt>
              <dd>{formatDate(planting.startDate)}</dd>
            </div>
          </dl>
          {planting.observations && (
            <p className="card-note">{planting.observations}</p>
          )}
          <div className="planting-card-actions">
            <button
              className="button button--ghost"
              onClick={() => onOpen(planting)}
            >
              Abrir plantio
            </button>
            {view === "history" && (
              <button
                className="button button--primary"
                onClick={() => onOpen(planting)}
              >
                <BarChart3 size={17} /> Ver fechamento
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
