import { DynamicDiaryFields } from "../DynamicDiaryFields";
import { Modal } from "../Modal";

export function DiaryFormModal({
  editing,
  form,
  plantings,
  products,
  machines,
  activityTypes,
  operationManaged,
  legacyHarvest,
  today,
  saving,
  draftRecovered,
  onChange,
  onClose,
  onSubmit,
}) {
  const selectedType = activityTypes.find(
    (item) => item.value === form.activityType,
  );
  const activityLabel = selectedType?.label?.toLowerCase() || "atividade";

  return (
    <Modal
      title={editing ? "Editar atividade" : `Registrar ${activityLabel}`}
      description={
        draftRecovered
          ? "Recuperamos o rascunho que estava salvo neste aparelho."
          : "A data de hoje já está preenchida. Informe os demais dados."
      }
      onClose={onClose}
      dismissible={!saving}
      className="diary-form-modal"
    >
      <form className="form" onSubmit={onSubmit}>
        <DynamicDiaryFields
          form={form}
          setForm={onChange}
          plantings={plantings}
          products={products}
          machines={machines}
          activityTypes={activityTypes}
          operationManaged={operationManaged}
          legacyHarvest={legacyHarvest}
          today={today}
        />
        <div className="form-actions">
          <button
            type="button"
            className="button button--ghost"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </button>
          <button className="button button--primary" disabled={saving}>
            {saving ? "Salvando..." : "Salvar lançamento"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
