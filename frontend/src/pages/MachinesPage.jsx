import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import {
  EmptyState,
  ErrorBanner,
  LoadingState,
  SuccessBanner,
} from "../components/Feedback";
import { PageHeader } from "../components/PageHeader";
import { MachineFormModal } from "../components/machines/MachineFormModal";
import { MachineList } from "../components/machines/MachineList";
import { MachineSummary } from "../components/machines/MachineSummary";
import { MaintenanceFormModal } from "../components/machines/MaintenanceFormModal";
import { MaintenanceHistory } from "../components/machines/MaintenanceHistory";
import { toInputDate } from "../utils/formatters";

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
      <MachineSummary summary={summary} />

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
          <MachineList
            machines={machines}
            selectedMachineId={selectedMachine?.id}
            onEdit={openEdit}
            onDelete={removeMachine}
            onSelect={selectMachine}
            onMaintenance={openMaintenance}
          />
          <MaintenanceHistory
            machine={selectedMachine}
            maintenances={maintenances}
            onCreate={() => openMaintenance(selectedMachine)}
            onEdit={openEditMaintenance}
            onDelete={removeMaintenance}
          />
        </div>
      )}

      {machineModal && (
        <MachineFormModal
          editing={Boolean(editingMachine)}
          form={machineForm}
          saving={saving}
          onChange={setMachineForm}
          onClose={() => setMachineModal(false)}
          onSubmit={submitMachine}
        />
      )}

      {maintenanceModal && selectedMachine && (
        <MaintenanceFormModal
          editing={Boolean(editingMaintenance)}
          machine={selectedMachine}
          form={maintenanceForm}
          saving={saving}
          onChange={setMaintenanceForm}
          onClose={() => setMaintenanceModal(false)}
          onSubmit={submitMaintenance}
        />
      )}
    </div>
  );
}
