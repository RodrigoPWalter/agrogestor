export function DiaryBaseFields({
  form,
  type,
  plantings,
  activityTypes,
  today,
  operationManaged,
  onUpdate,
}) {
  const availablePlantings = plantings.filter(
    (planting) =>
      (operationManaged && planting.id === form.plantingId) ||
      isPlantingAvailableFor(type, planting),
  );
  const selectedPlantingIsAvailable = availablePlantings.some(
    (planting) => planting.id === form.plantingId,
  );
  const plantingSelectValue = selectedPlantingIsAvailable
    ? form.plantingId
    : "";

  return (
    <>
      <label>
        <span>Tipo de acontecimento</span>
        <select
          disabled={operationManaged}
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
          Plantio{" "}
          {["PLANTING", "HARVEST"].includes(type)
            ? "(obrigatório)"
            : "(opcional)"}
        </span>
        <select
          required={["PLANTING", "HARVEST"].includes(type)}
          disabled={operationManaged}
          value={plantingSelectValue}
          onChange={(event) => onUpdate("plantingId", event.target.value)}
        >
          <option value="">
            {plantingOptionPrompt(type, availablePlantings.length)}
          </option>
          {availablePlantings.map((planting) => (
            <option key={planting.id} value={planting.id}>
              {planting.crop} — {planting.harvest}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}

function plantingOptionPrompt(type, availableCount) {
  if (type === "PLANTING") {
    return availableCount > 0
      ? "Selecione o plantio"
      : "Nenhum plantio com área restante";
  }
  if (type === "HARVEST") {
    return availableCount > 0
      ? "Selecione o plantio"
      : "Nenhum plantio com área para colher";
  }
  return "Propriedade em geral";
}

function isPlantingAvailableFor(type, planting) {
  if (type === "PLANTING") {
    return hasRemainingPlantingArea(planting);
  }
  if (type === "HARVEST") {
    return hasRemainingHarvestArea(planting);
  }
  return true;
}

function hasRemainingPlantingArea(planting) {
  if (hasNumber(planting.remainingAreaHectares)) {
    return Number(planting.remainingAreaHectares) > 0;
  }
  if (
    hasNumber(planting.plannedAreaHectares) &&
    hasNumber(planting.plantedAreaHectares)
  ) {
    return (
      Number(planting.plantedAreaHectares) <
      Number(planting.plannedAreaHectares)
    );
  }
  return true;
}

function hasRemainingHarvestArea(planting) {
  if (hasNumber(planting.harvestRemainingAreaHectares)) {
    return (
      Number(planting.plantedAreaHectares) > 0 &&
      Number(planting.harvestRemainingAreaHectares) > 0
    );
  }
  if (
    hasNumber(planting.plantedAreaHectares) &&
    hasNumber(planting.harvestedAreaHectares)
  ) {
    return (
      Number(planting.plantedAreaHectares) >
      Number(planting.harvestedAreaHectares)
    );
  }
  return true;
}

function hasNumber(value) {
  return value !== null && value !== undefined && value !== "";
}
