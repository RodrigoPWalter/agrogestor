import { Plus } from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/formatters";

const categories = [
  ["SEEDS", "Sementes"],
  ["FERTILIZERS", "Fertilizantes"],
  ["PESTICIDES", "Defensivos"],
  ["FUEL", "Combustível"],
  ["MAINTENANCE", "Manutenção"],
  ["LABOR", "Mão de obra"],
  ["OTHER", "Outros"],
];

export function PlantingExpensesSection({
  expenses,
  expense,
  formOpen,
  saving,
  onExpenseChange,
  onToggleForm,
  onSubmit,
}) {
  function update(field, value) {
    onExpenseChange({ ...expense, [field]: value });
  }

  return (
    <section>
      <div className="section-heading">
        <h3>Gastos do plantio</h3>
        <button className="button button--primary" onClick={onToggleForm}>
          <Plus size={17} /> Registrar gasto
        </button>
      </div>
      {formOpen && (
        <form className="quick-expense-form" onSubmit={onSubmit}>
          <input
            required
            placeholder="Descrição"
            value={expense.description}
            onChange={(event) => update("description", event.target.value)}
          />
          <select
            value={expense.category}
            onChange={(event) => update("category", event.target.value)}
          >
            {categories.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            required
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Valor em R$"
            value={expense.amount}
            onChange={(event) => update("amount", event.target.value)}
          />
          <input
            required
            type="date"
            value={expense.expenseDate}
            onChange={(event) => update("expenseDate", event.target.value)}
          />
          <button className="button button--primary" disabled={saving}>
            {saving ? "Salvando..." : "Salvar gasto"}
          </button>
        </form>
      )}
      {expenses.length === 0 ? (
        <p className="muted-copy">Nenhum gasto registrado neste plantio.</p>
      ) : (
        <div className="compact-list">
          {expenses.map((item) => (
            <div key={item.id}>
              <span>
                {formatDate(item.expenseDate)} · {item.description}
              </span>
              <strong>{formatCurrency(item.amount)}</strong>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
