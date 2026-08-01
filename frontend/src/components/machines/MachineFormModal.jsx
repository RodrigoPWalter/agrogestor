import { Modal } from "../Modal";

export function MachineFormModal({
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
      title={editing ? "Editar máquina" : "Nova máquina"}
      description="Cadastre os dados e mantenha o horímetro atualizado."
      onClose={onClose}
      dismissible={!saving}
    >
      <form className="form" onSubmit={onSubmit}>
        <div className="form-grid">
          <label>
            <span>Marca</span>
            <input
              required
              maxLength="100"
              value={form.brand}
              onChange={(event) => update("brand", event.target.value)}
              placeholder="Ex.: John Deere"
            />
          </label>
          <label>
            <span>Modelo</span>
            <input
              required
              maxLength="120"
              value={form.model}
              onChange={(event) => update("model", event.target.value)}
              placeholder="Ex.: 6110J"
            />
          </label>
          <label>
            <span>Ano</span>
            <input
              required
              type="number"
              min="1900"
              max="2100"
              value={form.manufactureYear}
              onChange={(event) =>
                update("manufactureYear", event.target.value)
              }
            />
          </label>
          <label>
            <span>Horas de uso</span>
            <input
              required
              type="number"
              min="0"
              step="0.1"
              value={form.usageHours}
              onChange={(event) => update("usageHours", event.target.value)}
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
          <button className="button button--primary" disabled={saving}>
            {saving ? "Salvando..." : "Salvar máquina"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
