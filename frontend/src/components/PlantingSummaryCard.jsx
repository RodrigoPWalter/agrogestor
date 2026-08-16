import { formatCurrency } from "../utils/formatters";

export function PlantingSummaryCard({ summary, status = "ready" }) {
  const loading = status === "loading";
  const unavailable = status === "error";
  const fallback = loading ? "..." : "—";

  return (
    <div className="planting-card-finance">
      <div>
        <span>Total gasto</span>
        <strong>
          {unavailable || loading
            ? fallback
            : formatCurrency(summary?.totalExpenses || 0)}
        </strong>
      </div>
      <div>
        <span>Custo/ha</span>
        <strong>
          {unavailable || loading
            ? fallback
            : formatCurrency(summary?.expensePerHectare || 0)}
        </strong>
      </div>
      <div>
        <span>Lançamentos</span>
        <strong>
          {unavailable || loading ? fallback : summary?.expenseCount || 0}
        </strong>
      </div>
    </div>
  );
}
