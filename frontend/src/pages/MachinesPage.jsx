import {
  AlertTriangle,
  CalendarClock,
  Edit3,
  Gauge,
  Plus,
  Settings,
  Trash2,
  Tractor,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import {
  EmptyState,
  ErrorBanner,
  LoadingState,
  SuccessBanner,
} from "../components/Feedback";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  toInputDate,
} from "../utils/formatters";

const currentYear = new Date().getFullYear();
const emptyMachine = {
  model: "",
  brand: "",
  manufactureYear: currentYear,
  usageHours: "",
};
const emptyMaintenance = {
  maintenanceDate: toInputDate(),
  maintenanceType: "PREVENTIVE",
  replacedParts: "",
  cost: "",
  nextReviewHours: "",
  notes: "",
};

export function MachinesPage() {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [machineModal, setMachineModal] = useState(false);
  const [maintenanceModal, setMaintenanceModal] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);
  const [editingMaintenance, setEditingMaintenance] = useState(null);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [maintenances, setMaintenances] = useState([]);
  const [machineForm, setMachineForm] = useState(emptyMachine);
  const [maintenanceForm, setMaintenanceForm] = useState(emptyMaintenance);

  async function loadMachines() {
    setLoading(true);
    try {
      const data = await api.getMachines();
      setMachines(data);
      setError("");
      if (selectedMachine) {
        setSelectedMachine(
          data.find((item) => item.id === selectedMachine.id) || null,
        );
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadMachines();
  }, []);

  const summary = useMemo(
    () => ({
      total: machines.length,
      hours: machines.reduce(
        (sum, machine) => sum + Number(machine.usageHours),
        0,
      ),
      due: machines.filter((machine) => machine.reviewDue).length,
    }),
    [machines],
  );

  function openCreate() {
    setEditingMachine(null);
    setMachineForm(emptyMachine);
    setMachineModal(true);
  }
  function openEdit(machine) {
    setEditingMachine(machine);
    setMachineForm({
      model: machine.model,
      brand: machine.brand,
      manufactureYear: machine.manufactureYear,
      usageHours: machine.usageHours,
    });
    setMachineModal(true);
  }
  async function selectMachine(machine) {
    setSelectedMachine(machine);
    try {
      setMaintenances(await api.getMaintenances(machine.id));
    } catch (requestError) {
      setError(requestError.message);
    }
  }
  function openMaintenance(machine) {
    setSelectedMachine(machine);
    setEditingMaintenance(null);
    setMaintenanceForm({
      ...emptyMaintenance,
      nextReviewHours: Math.ceil(Number(machine.usageHours) + 250),
    });
    setMaintenanceModal(true);
  }
  function openEditMaintenance(item) {
    setEditingMaintenance(item);
    setMaintenanceForm({
      maintenanceDate: item.maintenanceDate,
      maintenanceType: item.maintenanceType,
      replacedParts: item.replacedParts || "",
      cost: item.cost,
      nextReviewHours: item.nextReviewHours || "",
      notes: item.notes || "",
    });
    setMaintenanceModal(true);
  }

  async function submitMachine(event) {
    event.preventDefault();
    setSaving(true);
    const payload = {
      ...machineForm,
      manufactureYear: Number(machineForm.manufactureYear),
      usageHours: Number(machineForm.usageHours),
    };
    try {
      if (editingMachine) {
        await api.updateMachine(editingMachine.id, payload);
        setSuccess("Máquina atualizada.");
      } else {
        await api.createMachine(payload);
        setSuccess("Máquina cadastrada.");
      }
      setMachineModal(false);
      await loadMachines();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function submitMaintenance(event) {
    event.preventDefault();
    setSaving(true);
    const payload = {
      ...maintenanceForm,
      cost: Number(maintenanceForm.cost),
      nextReviewHours: maintenanceForm.nextReviewHours
        ? Number(maintenanceForm.nextReviewHours)
        : null,
      replacedParts: maintenanceForm.replacedParts || null,
      notes: maintenanceForm.notes || null,
    };
    try {
      if (editingMaintenance) {
        await api.updateMaintenance(editingMaintenance.id, payload);
        setSuccess("Manutenção atualizada.");
      } else {
        await api.createMaintenance(selectedMachine.id, payload);
        setSuccess("Manutenção registrada.");
      }
      setMaintenanceModal(false);
      await loadMachines();
      await selectMachine(selectedMachine);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeMachine(machine) {
    if (
      !window.confirm(`Excluir a máquina “${machine.brand} ${machine.model}”?`)
    )
      return;
    try {
      await api.deleteMachine(machine.id);
      if (selectedMachine?.id === machine.id) setSelectedMachine(null);
      setSuccess("Máquina excluída.");
      await loadMachines();
    } catch (requestError) {
      setError(requestError.message);
    }
  }
  async function removeMaintenance(item) {
    if (!window.confirm("Excluir este registro de manutenção?")) return;
    try {
      await api.deleteMaintenance(item.id);
      setSuccess("Manutenção excluída.");
      await loadMachines();
      await selectMachine(selectedMachine);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Frota da propriedade"
        title="Máquinas e manutenção"
        description="Controle horímetro, custos e próximas revisões."
        action={
          <button className="button button--primary" onClick={openCreate}>
            <Plus size={18} /> Nova máquina
          </button>
        }
      />
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      <section className="module-summary-grid">
        <article>
          <span>
            <Tractor />
          </span>
          <div>
            <small>Máquinas cadastradas</small>
            <strong>{summary.total}</strong>
          </div>
        </article>
        <article>
          <span>
            <Gauge />
          </span>
          <div>
            <small>Horas acumuladas</small>
            <strong>{formatNumber(summary.hours, 1)} h</strong>
          </div>
        </article>
        <article className={summary.due ? "summary-warning" : ""}>
          <span>
            <CalendarClock />
          </span>
          <div>
            <small>Revisões vencidas</small>
            <strong>{summary.due}</strong>
          </div>
        </article>
      </section>

      {loading ? (
        <LoadingState label="Carregando a frota..." />
      ) : machines.length === 0 ? (
        <EmptyState
          title="Nenhuma máquina cadastrada"
          description="Adicione tratores, colheitadeiras e implementos."
          action={
            <button className="button button--primary" onClick={openCreate}>
              <Plus size={18} /> Cadastrar máquina
            </button>
          }
        />
      ) : (
        <div className="fleet-layout">
          <section className="data-card-grid machine-grid">
            {machines.map((machine) => (
              <article
                className={`data-card machine-card ${selectedMachine?.id === machine.id ? "is-selected" : ""}`}
                key={machine.id}
              >
                <div className="data-card__header">
                  <span className="crop-avatar crop-avatar--large">
                    <Tractor size={22} />
                  </span>
                  <div>
                    <h2>
                      {machine.brand} {machine.model}
                    </h2>
                    <span className="badge">Ano {machine.manufactureYear}</span>
                  </div>
                  <div className="card-actions">
                    <button
                      className="icon-button"
                      onClick={() => openEdit(machine)}
                      aria-label="Editar máquina"
                    >
                      <Edit3 size={17} />
                    </button>
                    <button
                      className="icon-button icon-button--danger"
                      onClick={() => removeMachine(machine)}
                      aria-label="Excluir máquina"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
                <div className="machine-hours">
                  <Gauge size={20} />
                  <div>
                    <strong>{formatNumber(machine.usageHours, 1)} h</strong>
                    <span>Horímetro atual</span>
                  </div>
                </div>
                {machine.nextReviewHours && (
                  <p
                    className={
                      machine.reviewDue ? "card-alert" : "machine-review"
                    }
                  >
                    <CalendarClock size={15} /> Próxima revisão:{" "}
                    {formatNumber(machine.nextReviewHours, 1)} h
                  </p>
                )}
                <div className="machine-actions">
                  <button
                    className="button button--ghost"
                    onClick={() => selectMachine(machine)}
                  >
                    <Settings size={16} /> Histórico
                  </button>
                  <button
                    className="button button--primary"
                    onClick={() => openMaintenance(machine)}
                  >
                    <Wrench size={16} /> Manutenção
                  </button>
                </div>
              </article>
            ))}
          </section>

          {selectedMachine && (
            <section className="panel maintenance-panel">
              <div className="panel__header">
                <div>
                  <span className="eyebrow">Histórico</span>
                  <h2>
                    {selectedMachine.brand} {selectedMachine.model}
                  </h2>
                </div>
                <button
                  className="button button--primary"
                  onClick={() => openMaintenance(selectedMachine)}
                >
                  <Plus size={16} /> Registrar
                </button>
              </div>
              {maintenances.length === 0 ? (
                <div className="compact-empty">
                  <Wrench size={28} />
                  <p>Nenhuma manutenção registrada.</p>
                </div>
              ) : (
                <div className="maintenance-list">
                  {maintenances.map((item) => (
                    <article key={item.id}>
                      <span
                        className={`maintenance-type maintenance-type--${item.maintenanceType.toLowerCase()}`}
                      >
                        {item.maintenanceTypeName}
                      </span>
                      <div>
                        <strong>
                          {formatDate(item.maintenanceDate)} ·{" "}
                          {formatCurrency(item.cost)}
                        </strong>
                        <small>
                          {item.replacedParts || "Sem peças informadas"}
                          {item.nextReviewHours
                            ? ` · Revisão em ${formatNumber(item.nextReviewHours, 1)} h`
                            : ""}
                        </small>
                      </div>
                      <div className="card-actions">
                        <button
                          className="icon-button"
                          onClick={() => openEditMaintenance(item)}
                          aria-label="Editar manutenção"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          className="icon-button icon-button--danger"
                          onClick={() => removeMaintenance(item)}
                          aria-label="Excluir manutenção"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {machineModal && (
        <Modal
          title={editingMachine ? "Editar máquina" : "Nova máquina"}
          description="Cadastre os dados e mantenha o horímetro atualizado."
          onClose={() => setMachineModal(false)}
        >
          <form className="form" onSubmit={submitMachine}>
            <div className="form-grid">
              <label>
                <span>Marca</span>
                <input
                  required
                  maxLength="100"
                  value={machineForm.brand}
                  onChange={(e) =>
                    setMachineForm({ ...machineForm, brand: e.target.value })
                  }
                  placeholder="Ex.: John Deere"
                />
              </label>
              <label>
                <span>Modelo</span>
                <input
                  required
                  maxLength="120"
                  value={machineForm.model}
                  onChange={(e) =>
                    setMachineForm({ ...machineForm, model: e.target.value })
                  }
                  placeholder="Ex.: 6110J"
                />
              </label>
              <label>
                <span>Ano</span>
                <input
                  required
                  type="number"
                  min="1900"
                  max="2100"
                  value={machineForm.manufactureYear}
                  onChange={(e) =>
                    setMachineForm({
                      ...machineForm,
                      manufactureYear: e.target.value,
                    })
                  }
                />
              </label>
              <label>
                <span>Horas de uso</span>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.1"
                  value={machineForm.usageHours}
                  onChange={(e) =>
                    setMachineForm({
                      ...machineForm,
                      usageHours: e.target.value,
                    })
                  }
                />
              </label>
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setMachineModal(false)}
              >
                Cancelar
              </button>
              <button className="button button--primary" disabled={saving}>
                {saving ? "Salvando..." : "Salvar máquina"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {maintenanceModal && (
        <Modal
          title={
            editingMaintenance ? "Editar manutenção" : "Registrar manutenção"
          }
          description={`${selectedMachine.brand} ${selectedMachine.model} · ${formatNumber(selectedMachine.usageHours, 1)} h atuais`}
          onClose={() => setMaintenanceModal(false)}
        >
          <form className="form" onSubmit={submitMaintenance}>
            <div className="form-grid">
              <label>
                <span>Data</span>
                <input
                  required
                  type="date"
                  value={maintenanceForm.maintenanceDate}
                  onChange={(e) =>
                    setMaintenanceForm({
                      ...maintenanceForm,
                      maintenanceDate: e.target.value,
                    })
                  }
                />
              </label>
              <label>
                <span>Tipo</span>
                <select
                  value={maintenanceForm.maintenanceType}
                  onChange={(e) =>
                    setMaintenanceForm({
                      ...maintenanceForm,
                      maintenanceType: e.target.value,
                    })
                  }
                >
                  <option value="PREVENTIVE">Preventiva</option>
                  <option value="CORRECTIVE">Corretiva</option>
                </select>
              </label>
              <label>
                <span>Custo (R$)</span>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={maintenanceForm.cost}
                  onChange={(e) =>
                    setMaintenanceForm({
                      ...maintenanceForm,
                      cost: e.target.value,
                    })
                  }
                />
              </label>
              <label>
                <span>Próxima revisão (horas)</span>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={maintenanceForm.nextReviewHours}
                  onChange={(e) =>
                    setMaintenanceForm({
                      ...maintenanceForm,
                      nextReviewHours: e.target.value,
                    })
                  }
                />
              </label>
              <label className="form-grid__full">
                <span>
                  Peças trocadas <small>(opcional)</small>
                </span>
                <input
                  maxLength="1000"
                  value={maintenanceForm.replacedParts}
                  onChange={(e) =>
                    setMaintenanceForm({
                      ...maintenanceForm,
                      replacedParts: e.target.value,
                    })
                  }
                  placeholder="Ex.: Filtro de óleo e correia"
                />
              </label>
              <label className="form-grid__full">
                <span>
                  Observações <small>(opcional)</small>
                </span>
                <textarea
                  rows="3"
                  maxLength="1000"
                  value={maintenanceForm.notes}
                  onChange={(e) =>
                    setMaintenanceForm({
                      ...maintenanceForm,
                      notes: e.target.value,
                    })
                  }
                />
              </label>
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setMaintenanceModal(false)}
              >
                Cancelar
              </button>
              <button className="button button--primary" disabled={saving}>
                {saving ? "Salvando..." : "Salvar manutenção"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
