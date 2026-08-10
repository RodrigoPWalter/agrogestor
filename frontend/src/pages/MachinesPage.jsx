import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { useConfirmation } from "../components/ConfirmationProvider";
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
import { useSingleFlight } from "../hooks/useSingleFlight";
import { useLatestRequestGuard } from "../hooks/useLatestRequestGuard";
import { mutationFeedback } from "../offline/offlineFeedback";
import { isOfflineResult } from "../offline/offlineSync";

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
  const requestConfirmation = useConfirmation();
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const { pending: saving, run: runSaving } = useSingleFlight();
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
  const beginMaintenanceRequest = useLatestRequestGuard();

  async function loadMachines({ showLoading = true } = {}) {
    if (showLoading) setLoading(true);
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
      if (showLoading) setLoading(false);
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
    const isCurrentRequest = beginMaintenanceRequest();
    setSelectedMachine(machine);
    try {
      const items = await api.getMaintenances(machine.id);
      if (isCurrentRequest()) setMaintenances(items);
    } catch (requestError) {
      if (isCurrentRequest()) setError(requestError.message);
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
    await runSaving(async () => {
      const payload = {
        ...machineForm,
        manufactureYear: Number(machineForm.manufactureYear),
        usageHours: Number(machineForm.usageHours),
      };

      try {
        let result;
        if (editingMachine) {
          result = await api.updateMachine(editingMachine.id, payload);
          setSuccess(mutationFeedback(result, "Máquina atualizada."));
        } else {
          result = await api.createMachine(payload);
          setSuccess(mutationFeedback(result, "Máquina cadastrada."));
        }
        setMachineModal(false);
        if (isOfflineResult(result)) return;
        await loadMachines({ showLoading: false });
      } catch (requestError) {
        setError(requestError.message);
      }
    });
  }

  async function submitMaintenance(event) {
    event.preventDefault();
    await runSaving(async () => {
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
        let result;
        if (editingMaintenance) {
          result = await api.updateMaintenance(editingMaintenance.id, payload);
          setSuccess(mutationFeedback(result, "Manutenção atualizada."));
        } else {
          result = await api.createMaintenance(selectedMachine.id, payload);
          setSuccess(mutationFeedback(result, "Manutenção registrada."));
        }
        setMaintenanceModal(false);
        if (isOfflineResult(result)) return;
        await loadMachines({ showLoading: false });
        await selectMachine(selectedMachine);
      } catch (requestError) {
        setError(requestError.message);
      }
    });
  }

  async function removeMachine(machine) {
    const confirmed = await requestConfirmation({
      title: "Excluir máquina?",
      description: `“${machine.brand} ${machine.model}” e seu histórico de manutenção serão excluídos.`,
      detail: "Esta ação não pode ser desfeita.",
      confirmLabel: "Excluir máquina",
    });
    if (!confirmed) return;

    try {
      const result = await api.deleteMachine(machine.id);
      if (selectedMachine?.id === machine.id) setSelectedMachine(null);
      setSuccess(mutationFeedback(result, "Máquina excluída."));
      if (isOfflineResult(result)) return;
      await loadMachines({ showLoading: false });
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function removeMaintenance(item) {
    const confirmed = await requestConfirmation({
      title: "Excluir manutenção?",
      description: "Este registro será removido do histórico da máquina.",
      confirmLabel: "Excluir manutenção",
    });
    if (!confirmed) return;

    try {
      const result = await api.deleteMaintenance(item.id);
      setSuccess(mutationFeedback(result, "Manutenção excluída."));
      if (isOfflineResult(result)) return;
      await loadMachines({ showLoading: false });
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
      <ErrorBanner message={error} onDismiss={() => setError("")} />
      <SuccessBanner message={success} onDismiss={() => setSuccess("")} />
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
