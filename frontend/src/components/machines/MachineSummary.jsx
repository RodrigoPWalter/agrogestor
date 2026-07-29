import { CalendarClock, Gauge, Tractor } from "lucide-react";
import { formatNumber } from "../../utils/formatters";

export function MachineSummary({ summary }) {
  return (
    <section className="module-summary-grid">
      <article>
        <span>
          <Tractor />
        </span>
        <div>
          <small>Máquinas cadastradas</small>
          <strong>{summary.total}</strong>
        </div>
      </article>
      <article>
        <span>
          <Gauge />
        </span>
        <div>
          <small>Horas acumuladas</small>
          <strong>{formatNumber(summary.hours, 1)} h</strong>
        </div>
      </article>
      <article className={summary.due ? "summary-warning" : ""}>
        <span>
          <CalendarClock />
        </span>
        <div>
          <small>Revisões vencidas</small>
          <strong>{summary.due}</strong>
        </div>
      </article>
    </section>
  );
}
