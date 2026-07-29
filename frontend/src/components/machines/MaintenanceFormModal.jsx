import { Modal } from "../Modal";
import { formatNumber } from "../../utils/formatters";

export function MaintenanceFormModal({
  editing,
  machine,
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
      title={editing ? "Editar manutenção" : "Registrar manutenção"}
      description={`${machine.brand} ${machine.model} · ${formatNumber(machine.usageHours, 1)} h atuais`}
      onClose={onClose}
    >
      <form className="form" onSubmit={onSubmit}>
        <div className="form-grid">
          <label>
            <span>Data</span>
            <input
              required
              type="date"
              value={form.maintenanceDate}
              onChange={(event) =>
                update("maintenanceDate", event.target.value)
              }
            />
          </label>
          <label>
            <span>Tipo</span>
            <select
              value={form.maintenanceType}
              onChange={(event) =>
                update("maintenanceType", event.target.value)
              }
            >
              <option value="PREVENTIVE">Preventiva</option>
              <option value="CORRECTIVE">Corretiva</option>
            </select>
          </label>
          <label>
            <span>Custo (R$)</span>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={form.cost}
              onChange={(event) => update("cost", event.target.value)}
            />
          </label>
          <label>
            <span>Próxima revisão (horas)</span>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={form.nextReviewHours}
              onChange={(event) =>
                update("nextReviewHours", event.target.value)
              }
            />
          </label>
          <label className="form-grid__full">
            <span>
              Peças trocadas <small>(opcional)</small>
            </span>
            <input
              maxLength="1000"
              value={form.replacedParts}
              onChange={(event) => update("replacedParts", event.target.value)}
              placeholder="Ex.: Filtro de óleo e correia"
            />
          </label>
          <label className="form-grid__full">
            <span>
              Observações <small>(opcional)</small>
            </span>
            <textarea
              rows="3"
              maxLength="1000"
              value={form.notes}
              onChange={(event) => update("notes", event.target.value)}
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
          <button className="button button--primary" disabled={saving}>
            {saving ? "Salvando..." : "Salvar manutenção"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
