export function HarvestFields({ form, onUpdate }) {
  return (
    <>
      <label>
        <span>Quantidade colhida</span>
        <input
          required
          type="number"
          min="0.001"
          step="0.001"
          inputMode="decimal"
          value={form.harvestQuantity}
          onChange={(event) => onUpdate("harvestQuantity", event.target.value)}
        />
      </label>
      <label>
        <span>Unidade</span>
        <input
          required
          value={form.harvestUnit}
          onChange={(event) => onUpdate("harvestUnit", event.target.value)}
        />
      </label>
    </>
  );
}
