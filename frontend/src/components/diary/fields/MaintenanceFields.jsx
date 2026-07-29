export function MaintenanceFields({ form, machines, onUpdate }) {
  return (
    <>
      <label className="form-grid__full">
        <span>Máquina</span>
        <select
          required
          value={form.machineId}
          onChange={(event) => onUpdate("machineId", event.target.value)}
        >
          <option value="">Selecione a máquina</option>
          {machines.map((machine) => (
            <option key={machine.id} value={machine.id}>
              {machine.brand} {machine.model}
            </option>
          ))}
        </select>
      </label>
      <label className="form-grid__full">
        <span>Descrição da manutenção</span>
        <input
          required
          value={form.activity}
          onChange={(event) => onUpdate("activity", event.target.value)}
          placeholder="Ex.: Troca de óleo e filtros"
        />
      </label>
      <label>
        <span>Valor (opcional)</span>
        <input
          type="number"
          min="0.01"
          step="0.01"
          inputMode="decimal"
          value={form.amount}
          onChange={(event) => onUpdate("amount", event.target.value)}
        />
      </label>
    </>
  );
}
