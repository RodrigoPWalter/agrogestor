import { AlertTriangle, PackagePlus, Warehouse } from "lucide-react";

export function InventorySummary({ summary }) {
  return (
    <section className="module-summary-grid">
      <article>
        <span>
          <Warehouse />
        </span>
        <div>
          <small>Produtos cadastrados</small>
          <strong>{summary.total}</strong>
        </div>
      </article>
      <article className={summary.low ? "summary-warning" : ""}>
        <span>
          <AlertTriangle />
        </span>
        <div>
          <small>Estoque baixo</small>
          <strong>{summary.low}</strong>
        </div>
      </article>
      <article className={summary.expired ? "summary-danger" : ""}>
        <span>
          <PackagePlus />
        </span>
        <div>
          <small>Validade vencida</small>
          <strong>{summary.expired}</strong>
        </div>
      </article>
    </section>
  );
}
