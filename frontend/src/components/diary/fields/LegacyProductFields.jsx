export function LegacyProductFields({ form, products, onUpdate }) {
  function updateLine(index, field, value) {
    onUpdate(
      "products",
      form.products.map((item, position) =>
        position === index ? { ...item, [field]: value } : item,
      ),
    );
  }

  return (
    <div className="form-grid form-grid__full">
      <p className="form-grid__full">
        Produtos deste registro. Altere cada quantidade separadamente.
      </p>
      {form.products.map((line, index) => (
        <div className="form-grid form-grid__full" key={index}>
          <label>
            <span>Produto {index + 1}</span>
            <select
              required
              value={line.productId}
              onChange={(event) =>
                updateLine(index, "productId", event.target.value)
              }
            >
              {!products.some((item) => item.id === line.productId) && (
                <option value={line.productId}>
                  {line.productName || "Produto registrado"}
                </option>
              )}
              {products.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — saldo {item.quantity} {item.unitName}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Quantidade do produto {index + 1}</span>
            <input
              required
              type="number"
              min="0.001"
              step="0.001"
              inputMode="decimal"
              value={line.quantity}
              onChange={(event) =>
                updateLine(index, "quantity", event.target.value)
              }
            />
          </label>
        </div>
      ))}
    </div>
  );
}
