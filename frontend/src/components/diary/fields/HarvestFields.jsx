const harvestUnits = [
  { value: "BAGS_60_KG", label: "Sacas de 60 kg" },
  { value: "KILOGRAMS", label: "Quilogramas" },
  { value: "TONNES", label: "Toneladas" },
];

export function HarvestFields({ form, legacy = false, onUpdate }) {
  return (
    <>
      {!legacy && (
        <label>
          <span>Hectares colhidos nesta etapa</span>
          <input
            required
            autoFocus
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            value={form.operationAreaHectares}
            onChange={(event) =>
              onUpdate("operationAreaHectares", event.target.value)
            }
            placeholder="Ex.: 8,5"
          />
        </label>
      )}
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
        {legacy ? (
          <input
            required
            value={form.harvestUnit}
            onChange={(event) => onUpdate("harvestUnit", event.target.value)}
          />
        ) : (
          <select
            required
            value={form.harvestUnit}
            onChange={(event) => onUpdate("harvestUnit", event.target.value)}
          >
            {harvestUnits.map((unit) => (
              <option key={unit.value} value={unit.value}>
                {unit.label}
              </option>
            ))}
          </select>
        )}
      </label>
      {!legacy && (
        <label className="form-grid__full">
          <span>Variedade colhida (opcional)</span>
          <input
            value={form.operationSeedVariety}
            onChange={(event) =>
              onUpdate("operationSeedVariety", event.target.value)
            }
            placeholder="Usa a variedade principal se ficar em branco"
          />
        </label>
      )}
    </>
  );
}
