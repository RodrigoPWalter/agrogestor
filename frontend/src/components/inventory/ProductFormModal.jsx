import { Modal } from "../Modal";
import { InlineErrorState, InlineLoadingState } from "../Feedback";
import { formatCurrency, formatDate } from "../../utils/formatters";

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
  product,
  form,
  history,
  historyLoading,
  historyError,
  saving,
  today,
  onChange,
  onClose,
  onRetryHistory,
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
      dismissible={!saving}
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
          {editing && Number(product?.quantity) > 0 && (
            <>
              <label>
                <span>Custo por {product.unitName.toLowerCase()}</span>
                <input
                  required
                  type="number"
                  min="0.000001"
                  step="0.000001"
                  inputMode="decimal"
                  value={form.newUnitCost}
                  onChange={(event) =>
                    update("newUnitCost", event.target.value)
                  }
                />
              </label>
              <label>
                <span>Data do custo</span>
                <input
                  required
                  type="date"
                  max={today}
                  value={form.adjustmentDate}
                  onChange={(event) =>
                    update("adjustmentDate", event.target.value)
                  }
                />
              </label>
            </>
          )}
        </div>

        {editing && Number(product?.quantity) > 0 && (
          <>
            <p className="form-note">
              O custo vale para os próximos usos do estoque. Gastos já lançados
              não serão alterados.
            </p>
            {historyLoading ? (
              <InlineLoadingState label="Carregando custos anteriores..." />
            ) : historyError ? (
              <InlineErrorState
                message={historyError}
                onRetry={onRetryHistory}
              />
            ) : history.length > 0 ? (
              <div className="mini-history">
                <strong>Custos anteriores</strong>
                {history.slice(0, 4).map((item) => (
                  <div key={item.id}>
                    <span>
                      {formatDate(item.adjustmentDate)}
                      {item.reason ? ` · ${item.reason}` : ""}
                    </span>
                    <b>
                      {formatCurrency(item.previousUnitCost)} →{" "}
                      {formatCurrency(item.newUnitCost)}
                    </b>
                  </div>
                ))}
              </div>
            ) : (
              <p className="inline-empty">Nenhum custo anterior registrado.</p>
            )}
          </>
        )}
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
            {saving ? "Salvando..." : "Salvar produto"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
