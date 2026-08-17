import { Modal } from "../Modal";
import { expenseCategories } from "./expenseCategories";

export function ExpenseFormModal({
  editing,
  form,
  plantings,
  scope,
  saving,
  draftRecovered,
  onChange,
  onClose,
  onSubmit,
}) {
  function update(field, value) {
    onChange({ ...form, [field]: value });
  }

  return (
    <Modal
      title={editing ? "Editar gasto" : "Registrar gasto"}
      description={
        draftRecovered
          ? "Recuperamos o rascunho que estava salvo neste aparelho."
          : scope === "property"
            ? "Registre um custo geral que não pertence a um plantio específico."
            : "Informe o valor e a categoria para manter o custo atualizado."
      }
      onClose={onClose}
      dismissible={!saving}
    >
      <form className="form" onSubmit={onSubmit}>
        <div className="form-grid">
          {scope === "property" ? (
            <div className="expense-form-scope-note form-grid__full">
              <strong>Gasto da propriedade</strong>
              <span>
                Este valor não será incluído no custo de nenhum plantio.
              </span>
            </div>
          ) : (
            <label className="form-grid__full">
              <span>Plantio relacionado</span>
              <select
                required
                value={form.plantingId}
                onChange={(event) => update("plantingId", event.target.value)}
              >
                {plantings.map((planting) => (
                  <option key={planting.id} value={planting.id}>
                    {planting.crop} — {planting.harvest}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="form-grid__full">
            <span>Descrição</span>
            <input
              required
              maxLength="160"
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              placeholder="Ex.: Adubo de base"
            />
          </label>
          <label>
            <span>Categoria</span>
            <select
              required
              value={form.category}
              onChange={(event) => update("category", event.target.value)}
            >
              {expenseCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Valor (R$)</span>
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(event) => update("amount", event.target.value)}
              placeholder="2.500,00"
            />
          </label>
          {form.category === "FUEL" && (
            <label>
              <span>Quantidade comprada (L, opcional)</span>
              <input
                type="number"
                min="0.001"
                step="0.001"
                inputMode="decimal"
                value={form.fuelLiters}
                onChange={(event) => update("fuelLiters", event.target.value)}
                placeholder="Ex.: 50"
              />
            </label>
          )}
          <label>
            <span>Data do gasto</span>
            <input
              required
              type="date"
              value={form.expenseDate}
              onChange={(event) => update("expenseDate", event.target.value)}
            />
          </label>
          <label>
            <span>
              Observações <small>(opcional)</small>
            </span>
            <input
              maxLength="1000"
              value={form.observations}
              onChange={(event) => update("observations", event.target.value)}
              placeholder="Ex.: Compra à vista"
            />
          </label>
        </div>
        <div className="form-actions">
          <button
            type="button"
            className="button button--ghost"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="button button--primary"
            disabled={saving}
          >
            {saving
              ? "Salvando..."
              : editing
                ? "Salvar alterações"
                : "Registrar gasto"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
