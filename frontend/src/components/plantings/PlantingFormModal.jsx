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
      dismissible={!saving}
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
            <span>Talhão ou área</span>
            <input
              maxLength="120"
              value={form.fieldName}
              onChange={(event) => update("fieldName", event.target.value)}
              placeholder="Ex.: Talhão 2"
            />
          </label>
          <label>
            <span>Área total prevista (ha)</span>
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={form.plannedAreaHectares}
              onChange={(event) =>
                update("plannedAreaHectares", event.target.value)
              }
              placeholder="18,50"
            />
          </label>
          <label>
            <span>Data de início</span>
            <input
              required
              type="date"
              value={form.startDate}
              onChange={(event) => update("startDate", event.target.value)}
            />
          </label>
          <label>
            <span>
              Distância entre linhas (cm) <small>(opcional)</small>
            </span>
            <input
              type="number"
              min="0.01"
              max="1000"
              step="0.01"
              inputMode="decimal"
              value={form.rowSpacingCentimeters}
              onChange={(event) =>
                update("rowSpacingCentimeters", event.target.value)
              }
              placeholder="Ex.: 70"
            />
          </label>
          <label>
            <span>Variedade planejada</span>
            <input
              required
              aria-label="Variedade planejada"
              maxLength="120"
              value={form.seedVariety}
              onChange={(event) => update("seedVariety", event.target.value)}
              placeholder="Ex.: BRS 284"
            />
            <span>
              <small>
                Será sugerida ao adicionar hectares e poderá ser trocada em cada
                etapa.
              </small>
            </span>
          </label>
          <label>
            <span>Taxa de semeadura</span>
            <input
              required
              type="number"
              min={form.seedRateUnit === "SEEDS_PER_HECTARE" ? "1" : "0.001"}
              step={form.seedRateUnit === "SEEDS_PER_HECTARE" ? "1" : "0.001"}
              value={form.seedRate}
              onChange={(event) => update("seedRate", event.target.value)}
              placeholder={
                form.seedRateUnit === "SEEDS_PER_HECTARE"
                  ? "Ex.: 60000"
                  : "Ex.: 50"
              }
            />
          </label>
          <label>
            <span>Unidade da taxa</span>
            <select
              required
              aria-label="Unidade da taxa"
              value={form.seedRateUnit}
              onChange={(event) => update("seedRateUnit", event.target.value)}
            >
              <option value="">Escolha uma unidade</option>
              <option value="KILOGRAMS_PER_HECTARE">
                Quilogramas por hectare (kg/ha)
              </option>
              <option value="SEEDS_PER_HECTARE">
                Sementes por hectare (sementes/ha)
              </option>
            </select>
            <span>
              <small>
                Use kg/ha para sementes medidas por peso ou sementes/ha quando
                souber a população desejada.
              </small>
            </span>
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
                : "Cadastrar plantio"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
