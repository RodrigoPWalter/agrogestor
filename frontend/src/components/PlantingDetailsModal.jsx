import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import { formatDate, formatNumber, toInputDate } from "../utils/formatters";
import { ErrorBanner, LoadingState, SuccessBanner } from "./Feedback";
import { Modal } from "./Modal";
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

function emptyStep() {
  return {
    stepDate: toInputDate(),
    plantedAreaHectares: "",
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
  const [stepForm, setStepForm] = useState(emptyStep);

  const load = useCallback(async () => {
    try {
      const [summary, expenses, diary, rainfall, closing, steps] =
        await Promise.all([
          api.getExpenseSummary(planting.id),
          api.getExpenses(planting.id),
          api.getDiaryEntries(planting.id),
          api.getRainfallByPlanting(planting.id).catch(() => []),
          api.getSeasonClosing(planting.id),
          api.getPlantingSteps(planting.id),
        ]);
      setData({
        summary,
        expenses: expenses.content,
        diary: diary.content,
        rainfall,
        closing,
        steps,
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

  function openStepCreate() {
    setEditingStep(null);
    setStepForm(emptyStep());
    setStepFormOpen(true);
    setError("");
  }

  function openStepEdit(step) {
    setEditingStep(step);
    setStepForm({
      stepDate: step.stepDate,
      plantedAreaHectares: step.plantedAreaHectares,
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
    setStepForm(emptyStep());
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
    if (
      !window.confirm(
        `Excluir a etapa de ${formatNumber(step.plantedAreaHectares)} ha registrada em ${formatDate(step.stepDate)}?`,
      )
    )
      return;

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
              onFinish={onFinish}
              onReactivate={onReactivate}
            />
          </>
        )}
      </div>
    </Modal>
  );
}
