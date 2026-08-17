import { expenseCategories } from "../../expenses/expenseCategories";

export function ExpenseFields({ form, onUpdate }) {
  return (
    <>
      <label className="form-grid__full">
        <span>Descrição do gasto</span>
        <input
          required
          maxLength="160"
          value={form.activity}
          onChange={(event) => onUpdate("activity", event.target.value)}
          placeholder="Ex.: Óleo diesel"
        />
      </label>
      <label>
        <span>Categoria</span>
        <select
          required
          value={form.expenseCategory}
          onChange={(event) => onUpdate("expenseCategory", event.target.value)}
        >
          {expenseCategories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Valor do gasto (R$)</span>
        <input
          required
          type="number"
          min="0.01"
          step="0.01"
          inputMode="decimal"
          value={form.amount}
          onChange={(event) => onUpdate("amount", event.target.value)}
          placeholder="Ex.: 350,00"
        />
      </label>
    </>
  );
}
