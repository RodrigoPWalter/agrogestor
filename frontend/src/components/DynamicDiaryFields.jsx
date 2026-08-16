import { DiaryBaseFields } from "./diary/fields/DiaryBaseFields";
import { HarvestFields } from "./diary/fields/HarvestFields";
import { MaintenanceFields } from "./diary/fields/MaintenanceFields";
import { PlantingOperationFields } from "./diary/fields/PlantingOperationFields";
import { ProductEventFields } from "./diary/fields/ProductEventFields";

export function DynamicDiaryFields({
  form,
  setForm,
  plantings,
  products,
  machines,
  activityTypes,
  today,
  operationManaged = false,
  legacyHarvest = false,
}) {
  const type = form.activityType;
  const needsDescription = ["INSPECTION", "OTHER"].includes(type);
  const productEvent = ["PRODUCT_PURCHASE", "PRODUCT_USE"].includes(type);

  function update(field, value) {
    setForm({ ...form, [field]: value });
  }

  return (
    <div className="form-grid dynamic-diary-form">
      <DiaryBaseFields
        form={form}
        type={type}
        plantings={plantings}
        activityTypes={activityTypes}
        today={today}
        operationManaged={operationManaged}
        onUpdate={update}
      />

      {type === "PLANTING" && (
        <PlantingOperationFields form={form} onUpdate={update} />
      )}

      {type === "RAIN" && (
        <label className="form-grid__full">
          <span>Quantidade de chuva (mm)</span>
          <input
            required
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            value={form.rainfallMillimeters}
            onChange={(event) =>
              update("rainfallMillimeters", event.target.value)
            }
            placeholder="Ex.: 28"
          />
        </label>
      )}

      {productEvent && (
        <ProductEventFields
          form={form}
          type={type}
          products={products}
          onUpdate={update}
        />
      )}

      {type === "MAINTENANCE" && (
        <MaintenanceFields form={form} machines={machines} onUpdate={update} />
      )}

      {type === "HARVEST" && (
        <HarvestFields form={form} legacy={legacyHarvest} onUpdate={update} />
      )}

      {needsDescription && (
        <label className="form-grid__full">
          <span>
            {type === "INSPECTION" ? "O que foi vistoriado" : "Descrição"}
          </span>
          <input
            required
            value={form.activity}
            onChange={(event) => update("activity", event.target.value)}
            placeholder="Descreva de forma curta"
          />
        </label>
      )}
      {type === "INSPECTION" && (
        <label>
          <span>Condição do tempo (opcional)</span>
          <input
            value={form.weatherCondition}
            onChange={(event) => update("weatherCondition", event.target.value)}
            placeholder="Ex.: Nublado"
          />
        </label>
      )}
      <label className="form-grid__full">
        <span>
          Observação{" "}
          {["OBSERVATION", "INSPECTION"].includes(type) ? "" : "(opcional)"}
        </span>
        <textarea
          required={["OBSERVATION", "INSPECTION"].includes(type)}
          rows="3"
          value={form.observations}
          onChange={(event) => update("observations", event.target.value)}
          placeholder="Anotação importante para consultar depois"
        />
      </label>
    </div>
  );
}
