import { Edit3, Plus, Trash2, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
  const [typeFilter, setTypeFilter] = useState("ALL");
  const counts = useMemo(
    () => ({
      ALL: maintenances.length,
      PREVENTIVE: maintenances.filter(
        (item) => item.maintenanceType === "PREVENTIVE",
      ).length,
      CORRECTIVE: maintenances.filter(
        (item) => item.maintenanceType === "CORRECTIVE",
      ).length,
    }),
    [maintenances],
  );
  const filteredMaintenances =
    typeFilter === "ALL"
      ? maintenances
      : maintenances.filter((item) => item.maintenanceType === typeFilter);

  useEffect(() => {
    setTypeFilter("ALL");
  }, [machine?.id]);

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
      {maintenances.length > 0 && (
        <div className="maintenance-filters" aria-label="Filtrar manutenções">
          {[
            ["ALL", "Todas"],
            ["PREVENTIVE", "Preventivas"],
            ["CORRECTIVE", "Corretivas"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={typeFilter === value ? "is-active" : ""}
              aria-pressed={typeFilter === value}
              onClick={() => setTypeFilter(value)}
            >
              {label} <span>{counts[value]}</span>
            </button>
          ))}
        </div>
      )}
      {maintenances.length === 0 ? (
        <div className="compact-empty">
          <Wrench size={28} />
          <p>Nenhuma manutenção registrada.</p>
        </div>
      ) : (
        <div className="maintenance-list">
          {filteredMaintenances.map((item) => (
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
                {item.diaryManaged && (
                  <small className="integrated-source">
                    Registrada no Diário
                  </small>
                )}
              </div>
              {!item.diaryManaged && (
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
              )}
            </article>
          ))}
          {filteredMaintenances.length === 0 && (
            <div className="compact-empty compact-empty--filter">
              <p>Nenhuma manutenção deste tipo.</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
