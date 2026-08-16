export function PlantingOperationFields({ form, onUpdate }) {
  return (
    <>
      <label>
        <span>Hectares plantados nesta etapa</span>
        <input
          required
          type="number"
          min="0.01"
          step="0.01"
          inputMode="decimal"
          value={form.operationAreaHectares}
          onChange={(event) =>
            onUpdate("operationAreaHectares", event.target.value)
          }
          placeholder="Ex.: 5"
        />
      </label>
      <label>
        <span>Variedade usada (opcional)</span>
        <input
          value={form.operationSeedVariety}
          onChange={(event) =>
            onUpdate("operationSeedVariety", event.target.value)
          }
          placeholder="Usa a variedade principal se ficar em branco"
        />
      </label>
    </>
  );
}
