import { formatCurrency } from "../utils/formatters";

export function PlantingSummaryCard({ summary }) {
  return (
    <div className="planting-card-finance">
      <div>
        <span>Total gasto</span>
        <strong>{formatCurrency(summary?.totalExpenses || 0)}</strong>
      </div>
      <div>
        <span>Custo/ha</span>
        <strong>{formatCurrency(summary?.expensePerHectare || 0)}</strong>
      </div>
      <div>
        <span>Lançamentos</span>
        <strong>{summary?.expenseCount || 0}</strong>
      </div>
    </div>
  );
}
