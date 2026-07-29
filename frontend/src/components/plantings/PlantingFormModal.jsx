import { Modal } from "../Modal";

export function PlantingFormModal({
  editing,
  form,
  saving,
  onChange,
  onClose,
  onSubmit,
}) {
  function update(field, value) {
    onChange({ ...form, [field]: value });
  }

  return (
    <Modal
      title={editing ? "Editar plantio" : "Novo plantio"}
      description="Preencha os dados principais da lavoura."
      onClose={onClose}
    >
      <form className="form" onSubmit={onSubmit}>
        <div className="form-grid">
          <label>
            <span>Cultura</span>
            <input
              required
              maxLength="80"
              value={form.crop}
              onChange={(event) => update("crop", event.target.value)}
              placeholder="Ex.: Soja"
            />
          </label>
          <label>
            <span>Safra</span>
            <input
              required
              pattern="(\d{4}|\d{4}/\d{4})"
              title="Use apenas um ano, como 2026, ou o formato 2026/2027"
              value={form.harvest}
              onChange={(event) => update("harvest", event.target.value)}
              placeholder="2026 ou 2026/2027"
            />
          </label>
          <label>
            <span>Área plantada (ha)</span>
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={form.plantedAreaHectares}
              onChange={(event) =>
                update("plantedAreaHectares", event.target.value)
              }
              placeholder="18,50"
            />
          </label>
          <label>
            <span>Data do plantio</span>
            <input
              required
              type="date"
              value={form.plantingDate}
              onChange={(event) => update("plantingDate", event.target.value)}
            />
          </label>
          <label>
            <span>Variedade da semente</span>
            <input
              required
              maxLength="120"
              value={form.seedVariety}
              onChange={(event) => update("seedVariety", event.target.value)}
              placeholder="Ex.: BRS 284"
            />
          </label>
          <label>
            <span>Quantidade de sementes</span>
            <input
              required
              type="number"
              min="0.001"
              step="0.001"
              value={form.seedQuantity}
              onChange={(event) => update("seedQuantity", event.target.value)}
              placeholder="925"
            />
          </label>
          <label className="form-grid__full">
            <span>
              Observações <small>(opcional)</small>
            </span>
            <textarea
              maxLength="1000"
              rows="3"
              value={form.observations}
              onChange={(event) => update("observations", event.target.value)}
              placeholder="Ex.: Talhão norte"
            />
          </label>
        </div>
        <div className="form-actions">
          <button
            type="button"
            className="button button--ghost"
            onClick={onClose}
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
                : "Cadastrar plantio"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
