import { AlertTriangle, ArrowDownToLine, Edit3, Trash2 } from "lucide-react";
import {
  formatCurrency,
  formatDate,
  formatNumber,
} from "../../utils/formatters";

export function InventoryProductList({
  products,
  onEdit,
  onDelete,
  onMovement,
}) {
  return (
    <section className="data-card-grid">
      {products.map((product) => (
        <article
          className={`data-card inventory-card ${product.lowStock ? "inventory-card--low" : ""}`}
          key={product.id}
        >
          <div className="data-card__header">
            <span className="crop-avatar">
              {product.productTypeName.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <h2>{product.name}</h2>
              <span className="badge">{product.productTypeName}</span>
            </div>
            <div className="card-actions">
              <button
                className="icon-button"
                onClick={() => onEdit(product)}
                aria-label="Editar produto"
              >
                <Edit3 size={17} />
              </button>
              <button
                className="icon-button icon-button--danger"
                onClick={() => onDelete(product)}
                aria-label="Excluir produto"
              >
                <Trash2 size={17} />
              </button>
            </div>
          </div>
          <div className="data-card__metric">
            <strong>
              {formatNumber(product.quantity, 3)} {product.unitName}
            </strong>
            <span>Saldo disponível</span>
          </div>
          <dl className="details-list">
            <div>
              <dt>Estoque mínimo</dt>
              <dd>
                {formatNumber(product.minimumStock, 3)} {product.unitName}
              </dd>
            </div>
            <div>
              <dt>Validade</dt>
              <dd>
                {product.expirationDate
                  ? formatDate(product.expirationDate)
                  : "Não informada"}
              </dd>
            </div>
            <div>
              <dt>Custo médio</dt>
              <dd>
                {formatCurrency(product.averageUnitCost)} por{" "}
                {product.unitName.toLowerCase()}
              </dd>
            </div>
            <div>
              <dt>Valor no estoque</dt>
              <dd>{formatCurrency(product.inventoryValue)}</dd>
            </div>
          </dl>
          {(product.lowStock || product.expired) && (
            <p className="card-alert">
              <AlertTriangle size={15} />{" "}
              {product.expired ? "Produto vencido" : "Estoque abaixo do mínimo"}
            </p>
          )}
          <button
            className="button button--ghost button--wide"
            onClick={() => onMovement(product)}
          >
            <ArrowDownToLine size={17} /> Movimentar estoque
          </button>
        </article>
      ))}
    </section>
  );
}
