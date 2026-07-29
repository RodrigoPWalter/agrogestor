import {
  CalendarClock,
  Edit3,
  Gauge,
  Settings,
  Trash2,
  Tractor,
  Wrench,
} from "lucide-react";
import { formatNumber } from "../../utils/formatters";

export function MachineList({
  machines,
  selectedMachineId,
  onEdit,
  onDelete,
  onSelect,
  onMaintenance,
}) {
  return (
    <section className="data-card-grid machine-grid">
      {machines.map((machine) => (
        <article
          className={`data-card machine-card ${selectedMachineId === machine.id ? "is-selected" : ""}`}
          key={machine.id}
        >
          <div className="data-card__header">
            <span className="crop-avatar crop-avatar--large">
              <Tractor size={22} />
            </span>
            <div>
              <h2>
                {machine.brand} {machine.model}
              </h2>
              <span className="badge">Ano {machine.manufactureYear}</span>
            </div>
            <div className="card-actions">
              <button
                className="icon-button"
                onClick={() => onEdit(machine)}
                aria-label="Editar máquina"
              >
                <Edit3 size={17} />
              </button>
              <button
                className="icon-button icon-button--danger"
                onClick={() => onDelete(machine)}
                aria-label="Excluir máquina"
              >
                <Trash2 size={17} />
              </button>
            </div>
          </div>
          <div className="machine-hours">
            <Gauge size={20} />
            <div>
              <strong>{formatNumber(machine.usageHours, 1)} h</strong>
              <span>Horímetro atual</span>
            </div>
          </div>
          {machine.nextReviewHours && (
            <p className={machine.reviewDue ? "card-alert" : "machine-review"}>
              <CalendarClock size={15} /> Próxima revisão:{" "}
              {formatNumber(machine.nextReviewHours, 1)} h
            </p>
          )}
          <div className="machine-actions">
            <button
              className="button button--ghost"
              onClick={() => onSelect(machine)}
            >
              <Settings size={16} /> Histórico
            </button>
            <button
              className="button button--primary"
              onClick={() => onMaintenance(machine)}
            >
              <Wrench size={16} /> Manutenção
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}
