import { useEffect, useState } from "react";
import { Modal } from "../Modal";
import { toInputDate } from "../../utils/formatters";

const categories = [
  ["GENERAL", "Geral"],
  ["PLANTING", "Plantio"],
  ["MACHINE", "Máquina"],
  ["INVENTORY", "Estoque"],
  ["PURCHASE", "Compra"],
  ["OTHER", "Outro"],
];

function emptyForm() {
  return {
    title: "",
    category: "GENERAL",
    dueDate: toInputDate(),
    durationAmount: "1",
    durationUnit: "HOURS",
    plantingId: "",
    machineId: "",
    notes: "",
  };
}

function durationFields(minutes) {
  if (minutes >= 480 && minutes % 480 === 0) {
    return { durationAmount: String(minutes / 480), durationUnit: "DAYS" };
  }
  return {
    durationAmount: String(minutes / 60),
    durationUnit: "HOURS",
  };
}

export function TaskFormModal({
  task,
  plantings,
  machines,
  saving,
  onSave,
  onClose,
}) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!task) {
      setForm(emptyForm());
      return;
    }
    setForm({
      title: task.title,
      category: task.category,
      dueDate: task.dueDate,
      ...durationFields(task.estimatedDurationMinutes),
      plantingId: task.plantingId || "",
      machineId: task.machineId || "",
      notes: task.notes || "",
    });
  }, [task]);

  function setField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function submit(event) {
    event.preventDefault();
    const amount = Number(form.durationAmount);
    const estimatedDurationMinutes = Math.round(
      amount * (form.durationUnit === "DAYS" ? 480 : 60),
    );
    onSave({
      title: form.title,
      category: form.category,
      dueDate: form.dueDate,
      estimatedDurationMinutes,
      plantingId:
        form.category === "PLANTING" && form.plantingId
          ? form.plantingId
          : null,
      machineId:
        form.category === "MACHINE" && form.machineId ? form.machineId : null,
      notes: form.notes || null,
    });
  }

  return (
    <Modal
      title={task ? "Editar tarefa" : "Nova tarefa"}
      description="Informe o prazo e quanto tempo o serviço deve levar."
      onClose={onClose}
      dismissible={!saving}
    >
      <form className="form task-form" onSubmit={submit}>
        <div className="form-grid">
          <label className="form-grid__full">
            <span>O que precisa ser feito?</span>
            <input
              required
              maxLength="160"
              placeholder="Ex.: Consertar a plantadeira"
              value={form.title}
              onChange={(event) => setField("title", event.target.value)}
            />
          </label>
          <label>
            <span>Categoria</span>
            <select
              value={form.category}
              onChange={(event) => setField("category", event.target.value)}
            >
              {categories.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Prazo</span>
            <input
              required
              type="date"
              value={form.dueDate}
              onChange={(event) => setField("dueDate", event.target.value)}
            />
          </label>
          <label>
            <span>Tempo estimado</span>
            <input
              required
              type="number"
              min="0.25"
              step="0.25"
              value={form.durationAmount}
              onChange={(event) =>
                setField("durationAmount", event.target.value)
              }
            />
          </label>
          <label>
            <span>Unidade do tempo</span>
            <select
              value={form.durationUnit}
              onChange={(event) => setField("durationUnit", event.target.value)}
            >
              <option value="HOURS">Horas</option>
              <option value="DAYS">Dias de trabalho</option>
            </select>
          </label>
          {form.category === "PLANTING" && (
            <label className="form-grid__full">
              <span>
                Safra relacionada <small>(opcional)</small>
              </span>
              <select
                value={form.plantingId}
                onChange={(event) => setField("plantingId", event.target.value)}
              >
                <option value="">Sem vínculo com uma safra</option>
                {plantings.map((planting) => (
                  <option key={planting.id} value={planting.id}>
                    {planting.crop} — {planting.harvest}
                  </option>
                ))}
              </select>
            </label>
          )}
          {form.category === "MACHINE" && (
            <label className="form-grid__full">
              <span>
                Máquina relacionada <small>(opcional)</small>
              </span>
              <select
                value={form.machineId}
                onChange={(event) => setField("machineId", event.target.value)}
              >
                <option value="">Sem vínculo com uma máquina</option>
                {machines.map((machine) => (
                  <option key={machine.id} value={machine.id}>
                    {machine.brand} {machine.model}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="form-grid__full">
            <span>
              Observações <small>(opcional)</small>
            </span>
            <textarea
              rows="3"
              maxLength="1000"
              placeholder="Peças necessárias ou algum detalhe importante"
              value={form.notes}
              onChange={(event) => setField("notes", event.target.value)}
            />
          </label>
        </div>
        <p className="task-form__hint">
          A urgência aumenta sozinha conforme o prazo se aproxima.
        </p>
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
            {saving ? "Salvando..." : "Salvar tarefa"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
