import { formatCurrency, formatDate } from "../../utils/formatters";
import { Modal } from "../Modal";
import { InlineErrorState, InlineLoadingState } from "../Feedback";

export function InventoryValuationModal({
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
  const estimatedValue =
    Number(form.newUnitCost) > 0
      ? Number(product.quantity) * Number(form.newUnitCost)
      : null;

  function update(field, value) {
    onChange({ ...form, [field]: value });
  }

  return (
    <Modal
      title={`Ajustar custo de ${product.name}`}
      description={`Custo médio atual: ${formatCurrency(product.averageUnitCost)} por ${product.unitName.toLowerCase()}`}
      onClose={onClose}
      dismissible={!saving}
    >
      <form className="form" onSubmit={onSubmit}>
        <div className="form-grid">
          <label>
            <span>Novo custo por {product.unitName.toLowerCase()}</span>
            <input
              required
              type="number"
              min="0.000001"
              step="0.000001"
              inputMode="decimal"
              value={form.newUnitCost}
              onChange={(event) => update("newUnitCost", event.target.value)}
            />
          </label>
          <label>
            <span>Data do ajuste</span>
            <input
              required
              type="date"
              max={today}
              value={form.adjustmentDate}
              onChange={(event) => update("adjustmentDate", event.target.value)}
            />
          </label>
          <label className="form-grid__full">
            <span>Motivo do ajuste</span>
            <input
              required
              maxLength="500"
              value={form.reason}
              onChange={(event) => update("reason", event.target.value)}
              placeholder="Ex.: Correção conforme a nota fiscal"
            />
          </label>
        </div>

        <p className="form-note">
          {estimatedValue !== null
            ? `O saldo atual passará a valer ${formatCurrency(estimatedValue)}.`
            : "Informe o novo custo para conferir o valor do saldo."}{" "}
          O ajuste vale somente para usos futuros e não altera gastos já
          lançados.
        </p>

        {historyLoading ? (
          <InlineLoadingState label="Carregando ajustes anteriores..." />
        ) : historyError ? (
          <InlineErrorState message={historyError} onRetry={onRetryHistory} />
        ) : history.length > 0 ? (
          <div className="mini-history">
            <strong>Ajustes recentes</strong>
            {history.slice(0, 4).map((item) => (
              <div key={item.id}>
                <span>
                  {formatDate(item.adjustmentDate)} · {item.reason}
                </span>
                <b>
                  {formatCurrency(item.previousUnitCost)} →{" "}
                  {formatCurrency(item.newUnitCost)}
                </b>
              </div>
            ))}
          </div>
        ) : (
          <p className="inline-empty">Nenhum ajuste de custo registrado.</p>
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
            {saving ? "Salvando..." : "Salvar novo custo"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
