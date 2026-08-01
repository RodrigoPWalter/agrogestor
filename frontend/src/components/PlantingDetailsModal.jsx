import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import { formatDate, formatNumber, toInputDate } from "../utils/formatters";
import { useConfirmation } from "./ConfirmationProvider";
import { ErrorBanner, LoadingState, SuccessBanner } from "./Feedback";
import { Modal } from "./Modal";
import { HarvestProgressSection } from "./planting-details/HarvestProgressSection";
import { PlantingActivitySections } from "./planting-details/PlantingActivitySections";
import { PlantingExpensesSection } from "./planting-details/PlantingExpensesSection";
import { PlantingOverview } from "./planting-details/PlantingOverview";
import { PlantingProgressSection } from "./planting-details/PlantingProgressSection";
import { PlantingQuickActions } from "./planting-details/PlantingQuickActions";
import { SeasonClosingPanel } from "./planting-details/SeasonClosingPanel";

const emptyExpense = {
  description: "",
  category: "FERTILIZERS",
  amount: "",
  expenseDate: toInputDate(),
  observations: "",
};

function emptyStep(seedVariety = "") {
  return {
    stepDate: toInputDate(),
    plantedAreaHectares: "",
    seedVariety,
    startTime: "",
    endTime: "",
    observations: "",
  };
}

function emptyHarvestStep(seedVariety = "") {
  return {
    harvestDate: toInputDate(),
    harvestedAreaHectares: "",
    harvestQuantity: "",
    harvestUnit: "BAGS_60_KG",
    seedVariety,
    startTime: "",
    endTime: "",
    observations: "",
  };
}

export function PlantingDetailsModal({
  planting,
  onClose,
  onFinish,
  onReactivate,
  onChanged,
}) {
  const requestConfirmation = useConfirmation();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expense, setExpense] = useState(emptyExpense);
  const [salePrice, setSalePrice] = useState("");
  const [closingLoading, setClosingLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stepFormOpen, setStepFormOpen] = useState(false);
  const [editingStep, setEditingStep] = useState(null);
  const [stepForm, setStepForm] = useState(() =>
    emptyStep(planting.seedVariety),
  );
  const [harvestFormOpen, setHarvestFormOpen] = useState(false);
  const [editingHarvestStep, setEditingHarvestStep] = useState(null);
  const [harvestForm, setHarvestForm] = useState(() =>
    emptyHarvestStep(planting.seedVariety),
  );

  const load = useCallback(async () => {
    try {
      const [summary, expenses, diary, rainfall, closing, steps, harvestSteps] =
        await Promise.all([
          api.getExpenseSummary(planting.id),
          api.getExpenses(planting.id),
          api.getDiaryEntries(planting.id),
          api.getRainfallByPlanting(planting.id).catch(() => []),
          api.getSeasonClosing(planting.id),
          api.getPlantingSteps(planting.id),
          api.getHarvestSteps(planting.id),
        ]);
      setData({
        summary,
        expenses: expenses.content,
        diary: diary.content,
        rainfall,
        closing,
        steps,
        harvestSteps,
      });
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }, [planting.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function refreshStepsAndDiary() {
    const [steps, diary] = await Promise.all([
      api.getPlantingSteps(planting.id),
      api.getDiaryEntries(planting.id),
    ]);
    setData((current) => ({
      ...current,
      steps,
      diary: diary.content,
    }));
  }

  async function refreshHarvestAndDiary() {
    const [harvestSteps, diary, closing] = await Promise.all([
      api.getHarvestSteps(planting.id),
      api.getDiaryEntries(planting.id),
      api.getSeasonClosing(planting.id),
    ]);
    setData((current) => ({
      ...current,
      harvestSteps,
      diary: diary.content,
      closing,
    }));
  }

  function openStepCreate() {
    setEditingStep(null);
    setStepForm(emptyStep(planting.seedVariety));
    setStepFormOpen(true);
    setError("");
  }

  function openStepEdit(step) {
    setEditingStep(step);
    setStepForm({
      stepDate: step.stepDate,
      plantedAreaHectares: step.plantedAreaHectares,
      seedVariety: step.seedVariety || planting.seedVariety,
      startTime: step.startTime?.slice(0, 5) || "",
      endTime: step.endTime?.slice(0, 5) || "",
      observations: step.observations || "",
    });
    setStepFormOpen(true);
    setError("");
  }

  function closeStepForm() {
    setStepFormOpen(false);
    setEditingStep(null);
    setStepForm(emptyStep(planting.seedVariety));
  }

  async function saveStep(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      ...stepForm,
      plantedAreaHectares: Number(stepForm.plantedAreaHectares),
      startTime: stepForm.startTime || null,
      endTime: stepForm.endTime || null,
      observations: stepForm.observations || null,
    };

    try {
      if (editingStep) {
        await api.updatePlantingStep(planting.id, editingStep.id, payload);
        setSuccess("Etapa de plantio atualizada.");
      } else {
        await api.createPlantingStep(planting.id, payload);
        setSuccess("Etapa de plantio adicionada com sucesso.");
      }
      closeStepForm();
      await refreshStepsAndDiary();
      await onChanged();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteStep(step) {
    const confirmed = await requestConfirmation({
      title: "Excluir etapa de plantio?",
      description: `${formatNumber(step.plantedAreaHectares)} ha registrados em ${formatDate(step.stepDate)} serão removidos.`,
      detail: "O progresso total do plantio será recalculado.",
      confirmLabel: "Excluir etapa",
    });
    if (!confirmed) return;

    setError("");
    try {
      await api.deletePlantingStep(planting.id, step.id);
      setSuccess("Etapa excluída e progresso recalculado.");
      await refreshStepsAndDiary();
      await onChanged();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function openHarvestCreate() {
    setEditingHarvestStep(null);
    setHarvestForm(emptyHarvestStep(planting.seedVariety));
    setHarvestFormOpen(true);
    setError("");
  }

  function openHarvestEdit(step) {
    setEditingHarvestStep(step);
    setHarvestForm({
      harvestDate: step.harvestDate,
      harvestedAreaHectares: step.harvestedAreaHectares,
      harvestQuantity: step.harvestQuantity,
      harvestUnit: step.harvestUnit,
      seedVariety: step.seedVariety || planting.seedVariety,
      startTime: step.startTime?.slice(0, 5) || "",
      endTime: step.endTime?.slice(0, 5) || "",
      observations: step.observations || "",
    });
    setHarvestFormOpen(true);
    setError("");
  }

  function closeHarvestForm() {
    setHarvestFormOpen(false);
    setEditingHarvestStep(null);
    setHarvestForm(emptyHarvestStep(planting.seedVariety));
  }

  async function saveHarvestStep(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      ...harvestForm,
      harvestedAreaHectares: Number(harvestForm.harvestedAreaHectares),
      harvestQuantity: Number(harvestForm.harvestQuantity),
      startTime: harvestForm.startTime || null,
      endTime: harvestForm.endTime || null,
      observations: harvestForm.observations || null,
    };

    try {
      if (editingHarvestStep) {
        await api.updateHarvestStep(
          planting.id,
          editingHarvestStep.id,
          payload,
        );
        setSuccess("Etapa de colheita atualizada.");
      } else {
        await api.createHarvestStep(planting.id, payload);
        setSuccess("Colheita do dia registrada com sucesso.");
      }
      closeHarvestForm();
      await refreshHarvestAndDiary();
      await onChanged();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteHarvestStep(step) {
    const confirmed = await requestConfirmation({
      title: "Excluir etapa de colheita?",
      description: `${formatNumber(step.harvestedAreaHectares)} ha colhidos em ${formatDate(step.harvestDate)} serão removidos.`,
      detail: "O progresso total da colheita será recalculado.",
      confirmLabel: "Excluir etapa",
    });
    if (!confirmed) return;

    setError("");
    try {
      await api.deleteHarvestStep(planting.id, step.id);
      setSuccess("Etapa de colheita excluída e totais recalculados.");
      await refreshHarvestAndDiary();
      await onChanged();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function registerExpense(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.createExpense({
        ...expense,
        plantingId: planting.id,
        amount: Number(expense.amount),
        observations: expense.observations || null,
      });
      setExpense({ ...emptyExpense, expenseDate: toInputDate() });
      setShowExpenseForm(false);
      await load();
      await onChanged();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function updateClosing(event) {
    event.preventDefault();
    setClosingLoading(true);
    try {
      const closing = await api.getSeasonClosing(planting.id, salePrice);
      setData((current) => ({ ...current, closing }));
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setClosingLoading(false);
    }
  }

  return (
    <Modal
      title={`${planting.crop} — ${planting.harvest}`}
      description={`${formatNumber(planting.plannedAreaHectares)} ha previstos · iniciado em ${formatDate(planting.startDate)}`}
      onClose={onClose}
    >
      <div className="planting-detail">
        <ErrorBanner message={error} onDismiss={() => setError("")} />
        <SuccessBanner message={success} onDismiss={() => setSuccess("")} />
        {!data ? (
          <LoadingState label="Carregando o plantio..." />
        ) : (
          <>
            <PlantingOverview
              planting={planting}
              summary={data.summary}
              expenseCount={data.expenses.length}
            />
            <PlantingProgressSection
              planting={planting}
              steps={data.steps}
              form={stepForm}
              formOpen={stepFormOpen}
              editing={editingStep}
              saving={saving}
              today={toInputDate()}
              onFormChange={setStepForm}
              onCreate={openStepCreate}
              onEdit={openStepEdit}
              onCancel={closeStepForm}
              onSubmit={saveStep}
              onDelete={deleteStep}
            />
            <HarvestProgressSection
              planting={planting}
              steps={data.harvestSteps}
              plantingSteps={data.steps}
              form={harvestForm}
              formOpen={harvestFormOpen}
              editing={editingHarvestStep}
              saving={saving}
              today={toInputDate()}
              onFormChange={setHarvestForm}
              onCreate={openHarvestCreate}
              onEdit={openHarvestEdit}
              onCancel={closeHarvestForm}
              onSubmit={saveHarvestStep}
              onDelete={deleteHarvestStep}
              onFinish={onFinish}
            />
            <SeasonClosingPanel
              closing={data.closing}
              salePrice={salePrice}
              loading={closingLoading}
              onSalePriceChange={(event) => setSalePrice(event.target.value)}
              onSubmit={updateClosing}
            />
            <PlantingExpensesSection
              expenses={data.expenses}
              expense={expense}
              formOpen={showExpenseForm}
              saving={saving}
              onExpenseChange={setExpense}
              onToggleForm={() => setShowExpenseForm(!showExpenseForm)}
              onSubmit={registerExpense}
            />
            <PlantingActivitySections
              diary={data.diary}
              rainfall={data.rainfall}
            />
            <PlantingQuickActions
              planting={planting}
              onShowExpenseForm={() => setShowExpenseForm(true)}
              onReactivate={onReactivate}
            />
          </>
        )}
      </div>
    </Modal>
  );
}
