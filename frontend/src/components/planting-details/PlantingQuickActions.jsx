import { BookOpenText, CloudRain, ReceiptText, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";

export function PlantingQuickActions({
  planting,
  onShowExpenseForm,
  onReactivate,
}) {
  return (
    <section>
      <h3>Ações rápidas</h3>
      <div className="quick-actions">
        <button className="button button--primary" onClick={onShowExpenseForm}>
          <ReceiptText size={18} /> Registrar gasto
        </button>
        <Link
          className="button button--ghost"
          to={`/diario?plantingId=${planting.id}&new=rain`}
        >
          <CloudRain size={18} /> Registrar chuva
        </Link>
        <Link
          className="button button--ghost"
          to={`/diario?plantingId=${planting.id}&new=observation`}
        >
          <BookOpenText size={18} /> Nova observação
        </Link>
        {planting.status === "HARVESTED" && (
          <button
            className="button button--primary"
            onClick={() => onReactivate(planting)}
          >
            <RotateCcw size={18} /> Reativar plantio
          </button>
        )}
      </div>
    </section>
  );
}
