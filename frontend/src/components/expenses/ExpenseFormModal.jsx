import { Modal } from "../Modal";

const categories = [
  { value: "SEEDS", label: "Sementes" },
  { value: "FERTILIZERS", label: "Fertilizantes" },
  { value: "PESTICIDES", label: "Defensivos" },
  { value: "FUEL", label: "Combustível" },
  { value: "MAINTENANCE", label: "Manutenção" },
  { value: "LABOR", label: "Mão de obra" },
  { value: "OTHER", label: "Outros" },
];

export function ExpenseFormModal({
  editing,
  form,
  plantings,
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
          : "Informe o valor e a categoria para manter o custo atualizado."
      }
      onClose={onClose}
      dismissible={!saving}
    >
      <form className="form" onSubmit={onSubmit}>
        <div className="form-grid">
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
              {categories.map((category) => (
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
