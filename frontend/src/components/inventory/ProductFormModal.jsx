import { Modal } from "../Modal";

const productTypes = [
  { value: "SEED", label: "Semente" },
  { value: "FERTILIZER", label: "Fertilizante" },
  { value: "PESTICIDE", label: "Defensivo" },
];

const units = [
  { value: "LITER", label: "Litros (L)" },
  { value: "KILOGRAM", label: "Quilogramas (Kg)" },
  { value: "UNIT", label: "Unidades" },
];

export function ProductFormModal({
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
      title={editing ? "Editar produto" : "Novo produto"}
      description="Informe os dados de controle do insumo."
      onClose={onClose}
    >
      <form className="form" onSubmit={onSubmit}>
        <div className="form-grid">
          <label className="form-grid__full">
            <span>Nome do produto</span>
            <input
              required
              maxLength="140"
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="Ex.: Herbicida glifosato"
            />
          </label>
          <label>
            <span>Tipo</span>
            <select
              value={form.productType}
              onChange={(event) => update("productType", event.target.value)}
            >
              {productTypes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Unidade</span>
            <select
              value={form.unit}
              onChange={(event) => update("unit", event.target.value)}
            >
              {units.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{editing ? "Saldo atual" : "Quantidade inicial"}</span>
            <input
              required
              disabled={editing}
              type="number"
              min="0"
              step="0.001"
              value={form.initialQuantity}
              onChange={(event) =>
                update("initialQuantity", event.target.value)
              }
            />
          </label>
          <label>
            <span>Alerta abaixo de</span>
            <input
              required
              type="number"
              min="0"
              step="0.001"
              value={form.minimumStock}
              onChange={(event) => update("minimumStock", event.target.value)}
            />
          </label>
          <label>
            <span>
              Data de validade <small>(opcional)</small>
            </span>
            <input
              type="date"
              value={form.expirationDate}
              onChange={(event) => update("expirationDate", event.target.value)}
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
            {saving ? "Salvando..." : "Salvar produto"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
