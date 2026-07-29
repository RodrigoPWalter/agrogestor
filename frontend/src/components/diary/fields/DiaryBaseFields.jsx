export function DiaryBaseFields({
  form,
  type,
  plantings,
  activityTypes,
  today,
  onUpdate,
}) {
  return (
    <>
      <label>
        <span>Tipo de acontecimento</span>
        <select
          value={type}
          onChange={(event) => onUpdate("activityType", event.target.value)}
        >
          {activityTypes.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Data</span>
        <input
          required
          type="date"
          max={today}
          value={form.entryDate}
          onChange={(event) => onUpdate("entryDate", event.target.value)}
        />
      </label>
      <label className="form-grid__full">
        <span>
          Plantio {type === "HARVEST" ? "(obrigatório)" : "(opcional)"}
        </span>
        <select
          required={type === "HARVEST"}
          value={form.plantingId}
          onChange={(event) => onUpdate("plantingId", event.target.value)}
        >
          <option value="">Propriedade em geral</option>
          {plantings.map((planting) => (
            <option key={planting.id} value={planting.id}>
              {planting.crop} — {planting.harvest}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
