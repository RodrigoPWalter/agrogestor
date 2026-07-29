import { Edit3, Plus, Trash2, Wrench } from "lucide-react";
import {
  formatCurrency,
  formatDate,
  formatNumber,
} from "../../utils/formatters";

export function MaintenanceHistory({
  machine,
  maintenances,
  onCreate,
  onEdit,
  onDelete,
}) {
  if (!machine) return null;

  return (
    <section className="panel maintenance-panel">
      <div className="panel__header">
        <div>
          <span className="eyebrow">Histórico</span>
          <h2>
            {machine.brand} {machine.model}
          </h2>
        </div>
        <button className="button button--primary" onClick={onCreate}>
          <Plus size={16} /> Registrar
        </button>
      </div>
      {maintenances.length === 0 ? (
        <div className="compact-empty">
          <Wrench size={28} />
          <p>Nenhuma manutenção registrada.</p>
        </div>
      ) : (
        <div className="maintenance-list">
          {maintenances.map((item) => (
            <article key={item.id}>
              <span
                className={`maintenance-type maintenance-type--${item.maintenanceType.toLowerCase()}`}
              >
                {item.maintenanceTypeName}
              </span>
              <div>
                <strong>
                  {formatDate(item.maintenanceDate)} ·{" "}
                  {formatCurrency(item.cost)}
                </strong>
                <small>
                  {item.replacedParts || "Sem peças informadas"}
                  {item.nextReviewHours
                    ? ` · Revisão em ${formatNumber(item.nextReviewHours, 1)} h`
                    : ""}
                </small>
              </div>
              <div className="card-actions">
                <button
                  className="icon-button"
                  onClick={() => onEdit(item)}
                  aria-label="Editar manutenção"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  className="icon-button icon-button--danger"
                  onClick={() => onDelete(item)}
                  aria-label="Excluir manutenção"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
