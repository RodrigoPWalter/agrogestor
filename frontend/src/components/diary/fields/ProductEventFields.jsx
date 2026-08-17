export function ProductEventFields({ form, type, products, onUpdate }) {
  const isPurchase = type === "PRODUCT_PURCHASE";
  const isNewProduct = isPurchase && !form.productId;
  const selectableProducts = isPurchase
    ? products
    : products.filter((item) => Number(item.quantity) > 0);

  return (
    <>
      <label className="form-grid__full">
        <span>Produto</span>
        <select
          required={type === "PRODUCT_USE" || !form.productName}
          value={form.productId}
          onChange={(event) => onUpdate("productId", event.target.value)}
        >
          <option value="">
            {isPurchase ? "Cadastrar um novo produto" : "Selecione no estoque"}
          </option>
          {selectableProducts.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} — saldo {item.quantity} {item.unitName}
            </option>
          ))}
        </select>
      </label>
      {isNewProduct && (
        <>
          <label>
            <span>Nome do novo produto</span>
            <input
              required
              value={form.productName}
              onChange={(event) => onUpdate("productName", event.target.value)}
              placeholder="Ex.: Glifosato"
            />
          </label>
          <label>
            <span>Tipo</span>
            <select
              value={form.productType}
              onChange={(event) => onUpdate("productType", event.target.value)}
            >
              <option value="SEED">Semente</option>
              <option value="FERTILIZER">Fertilizante</option>
              <option value="PESTICIDE">Defensivo</option>
            </select>
          </label>
        </>
      )}
      <label>
        <span>{isPurchase ? "Quantidade comprada" : "Quantidade usada"}</span>
        <input
          required
          type="number"
          min="0.001"
          step="0.001"
          inputMode="decimal"
          value={form.quantity}
          onChange={(event) => onUpdate("quantity", event.target.value)}
        />
      </label>
      {isNewProduct && (
        <label>
          <span>Unidade</span>
          <select
            value={form.unit}
            onChange={(event) => onUpdate("unit", event.target.value)}
          >
            <option value="LITER">Litros</option>
            <option value="KILOGRAM">Quilos</option>
            <option value="UNIT">Unidades</option>
          </select>
        </label>
      )}
      {isPurchase && (
        <>
          <label>
            <span>Fornecedor</span>
            <input
              value={form.supplier}
              onChange={(event) => onUpdate("supplier", event.target.value)}
              placeholder="Ex.: Cotricampo"
            />
          </label>
          <label>
            <span>Valor pago (opcional)</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              value={form.amount}
              onChange={(event) => onUpdate("amount", event.target.value)}
              placeholder="R$ 0,00"
            />
          </label>
        </>
      )}
    </>
  );
}
