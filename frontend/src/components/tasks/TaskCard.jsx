import {
  CalendarDays,
  Check,
  Clock3,
  Edit3,
  Play,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { formatDate } from "../../utils/formatters";

export function formatTaskDuration(minutes) {
  if (minutes >= 480 && minutes % 480 === 0) {
    const days = minutes / 480;
    return `${days} ${days === 1 ? "dia" : "dias"} de trabalho`;
  }
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1).replace(".", ",")} h`;
}

export function TaskCard({ task, busy, onEdit, onDelete, onStatusChange }) {
  const nextAction =
    task.status === "COMPLETED"
      ? { status: "PENDING", label: "Reabrir", icon: RotateCcw }
      : task.status === "PENDING"
        ? { status: "IN_PROGRESS", label: "Iniciar", icon: Play }
        : { status: "COMPLETED", label: "Concluir", icon: Check };
  const ActionIcon = nextAction.icon;

  return (
    <article className={`task-card task-card--${task.urgency.toLowerCase()}`}>
      <div className="task-card__main">
        <div className="task-card__heading">
          <span
            className={`task-urgency task-urgency--${task.urgency.toLowerCase()}`}
          >
            {task.urgencyLabel}
          </span>
          <small>{task.categoryLabel}</small>
        </div>
        <h3>{task.title}</h3>
        <div className="task-card__meta">
          <span>
            <CalendarDays size={15} /> Até {formatDate(task.dueDate)}
          </span>
          <span>
            <Clock3 size={15} />{" "}
            {formatTaskDuration(task.estimatedDurationMinutes)}
          </span>
        </div>
        {(task.plantingLabel || task.machineLabel) && (
          <p className="task-card__relation">
            {task.plantingLabel || task.machineLabel}
          </p>
        )}
        {task.notes && <p className="task-card__notes">{task.notes}</p>}
      </div>
      <div className="task-card__actions">
        <button
          type="button"
          className="button button--primary task-card__status-action"
          onClick={() => onStatusChange(task, nextAction.status)}
          disabled={busy}
        >
          <ActionIcon size={17} /> {nextAction.label}
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={() => onEdit(task)}
          aria-label={`Editar ${task.title}`}
          disabled={busy}
        >
          <Edit3 size={17} />
        </button>
        <button
          type="button"
          className="icon-button icon-button--danger"
          onClick={() => onDelete(task)}
          aria-label={`Excluir ${task.title}`}
          disabled={busy}
        >
          <Trash2 size={17} />
        </button>
      </div>
    </article>
  );
}
