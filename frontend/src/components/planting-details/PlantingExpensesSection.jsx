import { PackageOpen, Plus, ReceiptText } from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/formatters";

const categories = [
  ["SEEDS", "Sementes"],
  ["FERTILIZERS", "Fertilizantes"],
  ["PESTICIDES", "Defensivos"],
  ["FUEL", "Combustível"],
  ["MAINTENANCE", "Manutenção"],
  ["LABOR", "Mão de obra"],
  ["OTHER", "Outros"],
];

export function PlantingExpensesSection({
  expenses,
  expense,
  stockUse,
  inventoryProducts,
  formMode,
  formOpen,
  saving,
  onExpenseChange,
  onStockUseChange,
  onFormModeChange,
  onToggleForm,
  onSubmit,
  onStockSubmit,
}) {
  function update(field, value) {
    onExpenseChange({ ...expense, [field]: value });
  }

  function updateStockUse(field, value) {
    onStockUseChange({ ...stockUse, [field]: value });
  }

  const selectedProduct = inventoryProducts.find(
    (product) => product.id === stockUse.productId,
  );
  const estimatedCost =
    Number(stockUse.quantity || 0) *
    Number(selectedProduct?.averageUnitCost || 0);

  return (
    <section>
      <div className="section-heading">
        <h3>Gastos do plantio</h3>
        <button
          type="button"
          className="button button--primary"
          onClick={onToggleForm}
        >
          <Plus size={17} /> Registrar gasto
        </button>
      </div>

      {formOpen && (
        <div className="planting-cost-form">
          <div className="segmented-control expense-source-picker">
            <label className={formMode === "DIRECT" ? "is-selected" : ""}>
              <input
                type="radio"
                name="expense-source"
                checked={formMode === "DIRECT"}
                onChange={() => onFormModeChange("DIRECT")}
              />
              <ReceiptText size={16} /> Gasto direto
            </label>
            <label className={formMode === "STOCK" ? "is-selected" : ""}>
              <input
                type="radio"
                name="expense-source"
                checked={formMode === "STOCK"}
                onChange={() => onFormModeChange("STOCK")}
              />
              <PackageOpen size={16} /> Usar do estoque
            </label>
          </div>

          {formMode === "DIRECT" ? (
            <form className="quick-expense-form" onSubmit={onSubmit}>
              <input
                required
                placeholder="Descrição"
                value={expense.description}
                onChange={(event) => update("description", event.target.value)}
              />
              <select
                value={expense.category}
                onChange={(event) => update("category", event.target.value)}
              >
                {categories.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Valor em R$"
                value={expense.amount}
                onChange={(event) => update("amount", event.target.value)}
              />
              <input
                required
                type="date"
                value={expense.expenseDate}
                onChange={(event) => update("expenseDate", event.target.value)}
              />
              <button className="button button--primary" disabled={saving}>
                {saving ? "Salvando..." : "Salvar gasto"}
              </button>
            </form>
          ) : (
            <form className="quick-stock-use-form" onSubmit={onStockSubmit}>
              <label>
                <span>Produto disponível</span>
                <select
                  required
                  value={stockUse.productId}
                  onChange={(event) =>
                    updateStockUse("productId", event.target.value)
                  }
                >
                  <option value="">Selecione no estoque</option>
                  {inventoryProducts
                    .filter((product) => Number(product.quantity) > 0)
                    .map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} — {product.quantity} {product.unitName}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                <span>Quantidade usada</span>
                <input
                  required
                  type="number"
                  min="0.001"
                  max={selectedProduct?.quantity || undefined}
                  step="0.001"
                  inputMode="decimal"
                  value={stockUse.quantity}
                  onChange={(event) =>
                    updateStockUse("quantity", event.target.value)
                  }
                />
              </label>
              <label>
                <span>Data do uso</span>
                <input
                  required
                  type="date"
                  value={stockUse.entryDate}
                  onChange={(event) =>
                    updateStockUse("entryDate", event.target.value)
                  }
                />
              </label>
              <label className="stock-use-notes">
                <span>Observação (opcional)</span>
                <input
                  value={stockUse.observations}
                  onChange={(event) =>
                    updateStockUse("observations", event.target.value)
                  }
                  placeholder="Ex.: Aplicado no Talhão 2"
                />
              </label>
              <div className="stock-cost-preview" aria-live="polite">
                {selectedProduct &&
                Number(selectedProduct.averageUnitCost) > 0 ? (
                  <>
                    <span>
                      Custo médio:{" "}
                      {formatCurrency(selectedProduct.averageUnitCost)} por{" "}
                      {selectedProduct.unitName}
                    </span>
                    <strong>
                      Custo transferido: {formatCurrency(estimatedCost)}
                    </strong>
                  </>
                ) : selectedProduct ? (
                  <>
                    <span>
                      Este produto ainda não possui valor de compra informado.
                    </span>
                    <strong>Custo não disponível</strong>
                  </>
                ) : (
                  <span>Escolha um produto para ver o custo.</span>
                )}
              </div>
              <button className="button button--primary" disabled={saving}>
                {saving ? "Salvando..." : "Usar e transferir custo"}
              </button>
            </form>
          )}
        </div>
      )}

      {expenses.length === 0 ? (
        <p className="muted-copy">Nenhum gasto registrado neste plantio.</p>
      ) : (
        <div className="compact-list">
          {expenses.map((item) => (
            <div key={item.id}>
              <span>
                {formatDate(item.expenseDate)} · {item.description}
                {item.managedByInventory && (
                  <small className="expense-origin-label">Do estoque</small>
                )}
                {item.managedByMaintenance && (
                  <small className="expense-origin-label">Manutenção</small>
                )}
                {item.managedByDiary && (
                  <small className="expense-origin-label">Diário</small>
                )}
              </span>
              <strong>{formatCurrency(item.amount)}</strong>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
