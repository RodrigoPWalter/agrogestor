import { DynamicDiaryFields } from "../DynamicDiaryFields";
import { Modal } from "../Modal";

export function DiaryFormModal({
  editing,
  form,
  plantings,
  products,
  machines,
  activityTypes,
  today,
  saving,
  onChange,
  onClose,
  onSubmit,
}) {
  return (
    <Modal
      title={editing ? "Editar atividade" : "Nova atividade"}
      description="Registre o trabalho como ele aconteceu no campo."
      onClose={onClose}
    >
      <form className="form" onSubmit={onSubmit}>
        <DynamicDiaryFields
          form={form}
          setForm={onChange}
          plantings={plantings}
          products={products}
          machines={machines}
          activityTypes={activityTypes}
          today={today}
        />
        <div className="form-actions">
          <button
            type="button"
            className="button button--ghost"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button className="button button--primary" disabled={saving}>
            {saving ? "Salvando..." : "Salvar atividade"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
