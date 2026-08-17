import { formatCurrency } from "../../../utils/formatters";

export function SaleFields({ form, onUpdate }) {
  const total =
    Number(form.saleQuantityBags) > 0 && Number(form.salePricePerBag) > 0
      ? Number(form.saleQuantityBags) * Number(form.salePricePerBag)
      : 0;

  return (
    <>
      <label>
        <span>Quantidade vendida (sacas de 60 kg)</span>
        <input
          required
          type="number"
          min="0.001"
          step="0.001"
          inputMode="decimal"
          value={form.saleQuantityBags}
          onChange={(event) => onUpdate("saleQuantityBags", event.target.value)}
          placeholder="Ex.: 250"
        />
      </label>
      <label>
        <span>Preço por saca (R$)</span>
        <input
          required
          type="number"
          min="0.01"
          step="0.01"
          inputMode="decimal"
          value={form.salePricePerBag}
          onChange={(event) => onUpdate("salePricePerBag", event.target.value)}
          placeholder="Ex.: 125,00"
        />
      </label>
      <label className="form-grid__full">
        <span>Comprador (opcional)</span>
        <input
          maxLength="120"
          value={form.buyer}
          onChange={(event) => onUpdate("buyer", event.target.value)}
          placeholder="Ex.: Cooperativa"
        />
      </label>
      {total > 0 && (
        <p className="form-note form-grid__full">
          Valor total da venda: <strong>{formatCurrency(total)}</strong>
        </p>
      )}
    </>
  );
}
