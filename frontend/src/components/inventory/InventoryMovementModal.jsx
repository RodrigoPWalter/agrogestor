import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { formatDate, formatNumber } from "../../utils/formatters";
import { Modal } from "../Modal";

export function InventoryMovementModal({
  product,
  movement,
  movements,
  saving,
  onChange,
  onClose,
  onSubmit,
}) {
  function update(field, value) {
    onChange({ ...movement, [field]: value });
  }

  return (
    <Modal
      title={`Movimentar ${product.name}`}
      description={`Saldo atual: ${formatNumber(product.quantity, 3)} ${product.unitName}`}
      onClose={onClose}
    >
      <form className="form" onSubmit={onSubmit}>
        <div className="segmented-control inventory-movement-type">
          <label
            className={movement.movementType === "ENTRY" ? "is-selected" : ""}
          >
            <input
              type="radio"
              checked={movement.movementType === "ENTRY"}
              onChange={() => update("movementType", "ENTRY")}
            />
            <ArrowDownToLine size={17} /> Entrada
          </label>
          <label
            className={movement.movementType === "EXIT" ? "is-selected" : ""}
          >
            <input
              type="radio"
              checked={movement.movementType === "EXIT"}
              onChange={() => update("movementType", "EXIT")}
            />
            <ArrowUpFromLine size={17} /> Saída
          </label>
        </div>
        <div className="form-grid">
          <label>
            <span>Quantidade ({product.unitName})</span>
            <input
              required
              type="number"
              min="0.001"
              step="0.001"
              value={movement.quantity}
              onChange={(event) => update("quantity", event.target.value)}
            />
          </label>
          <label>
            <span>Data</span>
            <input
              required
              type="date"
              value={movement.movementDate}
              onChange={(event) => update("movementDate", event.target.value)}
            />
          </label>
          <label className="form-grid__full">
            <span>
              Observação <small>(opcional)</small>
            </span>
            <input
              maxLength="500"
              value={movement.notes}
              onChange={(event) => update("notes", event.target.value)}
              placeholder="Ex.: Aplicação no talhão norte"
            />
          </label>
        </div>
        {movements.length > 0 && (
          <div className="mini-history">
            <strong>Movimentações recentes</strong>
            {movements.slice(0, 4).map((item) => (
              <div key={item.id}>
                <span>
                  {item.movementTypeName} · {formatDate(item.movementDate)}
                </span>
                <b>
                  {formatNumber(item.quantity, 3)} {product.unitName}
                </b>
              </div>
            ))}
          </div>
        )}
        <div className="form-actions">
          <button
            type="button"
            className="button button--ghost"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button className="button button--primary" disabled={saving}>
            Registrar {movement.movementType === "ENTRY" ? "entrada" : "saída"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
