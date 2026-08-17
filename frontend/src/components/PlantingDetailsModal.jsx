import { useLayoutEffect, useState } from "react";
import { api } from "../api/client";
import { formatDate, formatNumber, toInputDate } from "../utils/formatters";
import { useSingleFlight } from "../hooks/useSingleFlight";
import { usePlantingDetailsData } from "../hooks/usePlantingDetailsData";
import { useConfirmation } from "./ConfirmationProvider";
import {
  ErrorBanner,
  InlineErrorState,
  InlineLoadingState,
  LoadingState,
  SuccessBanner,
} from "./Feedback";
import { Modal } from "./Modal";
import { HarvestProgressSection } from "./planting-details/HarvestProgressSection";
import { PlantingActivitySections } from "./planting-details/PlantingActivitySections";
import { PlantingExpensesSection } from "./planting-details/PlantingExpensesSection";
import { PlantingOverview } from "./planting-details/PlantingOverview";
import { PlantingProgressSection } from "./planting-details/PlantingProgressSection";
import { PlantingQuickActions } from "./planting-details/PlantingQuickActions";
import { SeasonClosingPanel } from "./planting-details/SeasonClosingPanel";
import { ProductionSalesSection } from "./production/ProductionSalesSection";
import { mutationFeedback } from "../offline/offlineFeedback";
import { isOfflineResult } from "../offline/offlineSync";

const emptyExpense = {
  description: "",
  category: "FERTILIZERS",
  amount: "",
  expenseDate: toInputDate(),
  observations: "",
};

const emptyStockUse = {
  productId: "",
  quantity: "",
  entryDate: toInputDate(),
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
  const { data, setData, loading, loadError, load } = usePlantingDetailsData(
    planting.id,
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expense, setExpense] = useState(emptyExpense);
  const [expenseFormMode, setExpenseFormMode] = useState("DIRECT");
  const [stockUse, setStockUse] = useState(emptyStockUse);
  const [salePrice, setSalePrice] = useState("");
  const { pending: closingLoading, run: runClosing } = useSingleFlight();
  const { pending: saving, run: runSaving } = useSingleFlight();
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

  useLayoutEffect(() => {
    if (data?.closing) {
      setSalePrice(data.closing.salePricePerUnit ?? "");
    }
  }, [data?.closing]);

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
    const [harvestSteps, diary, closing, productionStock, productionSales] =
      await Promise.all([
        api.getHarvestSteps(planting.id),
        api.getDiaryEntries(planting.id),
        api.getSeasonClosing(planting.id),
        api.getPlantingProductionStock(planting.id),
        api.getProductionSales(planting.id),
      ]);
    setData((current) => ({
      ...current,
      harvestSteps,
      diary: diary.content,
      closing,
      productionStock,
      productionSales,
    }));
    setSalePrice(closing.salePricePerUnit ?? "");
  }

  async function refreshProduction() {
    const [productionStock, productionSales, closing] = await Promise.all([
      api.getPlantingProductionStock(planting.id),
      api.getProductionSales(planting.id),
      api.getSeasonClosing(planting.id),
    ]);
    setData((current) => ({
      ...current,
      productionStock,
      productionSales,
      closing,
    }));
    setSalePrice(closing.salePricePerUnit ?? "");
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
    await runSaving(async () => {
      setError("");
      const payload = {
        ...stepForm,
        plantedAreaHectares: Number(stepForm.plantedAreaHectares),
        startTime: stepForm.startTime || null,
        endTime: stepForm.endTime || null,
        observations: stepForm.observations || null,
      };

      try {
        let result;
        if (editingStep) {
          result = await api.updatePlantingStep(
            planting.id,
            editingStep.id,
            payload,
          );
          setSuccess(mutationFeedback(result, "Etapa de plantio atualizada."));
        } else {
          result = await api.createPlantingStep(planting.id, payload);
          setSuccess(
            mutationFeedback(
              result,
              "Etapa de plantio adicionada com sucesso.",
            ),
          );
        }
        closeStepForm();
        if (isOfflineResult(result)) return;
        await refreshStepsAndDiary();
        await onChanged();
      } catch (requestError) {
        setError(requestError.message);
      }
    });
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
      const result = await api.deletePlantingStep(planting.id, step.id);
      setSuccess(
        mutationFeedback(result, "Etapa excluída e progresso recalculado."),
      );
      if (isOfflineResult(result)) return;
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
    await runSaving(async () => {
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
        let result;
        if (editingHarvestStep) {
          result = await api.updateHarvestStep(
            planting.id,
            editingHarvestStep.id,
            payload,
          );
          setSuccess(mutationFeedback(result, "Etapa de colheita atualizada."));
        } else {
          result = await api.createHarvestStep(planting.id, payload);
          setSuccess(
            mutationFeedback(result, "Colheita do dia registrada com sucesso."),
          );
        }
        closeHarvestForm();
        if (isOfflineResult(result)) return;
        await refreshHarvestAndDiary();
        await onChanged();
      } catch (requestError) {
        setError(requestError.message);
      }
    });
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
      const result = await api.deleteHarvestStep(planting.id, step.id);
      setSuccess(
        mutationFeedback(
          result,
          "Etapa de colheita excluída e totais recalculados.",
        ),
      );
      if (isOfflineResult(result)) return;
      await refreshHarvestAndDiary();
      await onChanged();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function registerExpense(event) {
    event.preventDefault();
    await runSaving(async () => {
      try {
        const result = await api.createExpense({
          ...expense,
          plantingId: planting.id,
          amount: Number(expense.amount),
          observations: expense.observations || null,
        });
        setExpense({ ...emptyExpense, expenseDate: toInputDate() });
        setShowExpenseForm(false);
        setSuccess(mutationFeedback(result, "Gasto registrado no plantio."));
        if (isOfflineResult(result)) return;
        await load();
        await onChanged();
      } catch (requestError) {
        setError(requestError.message);
      }
    });
  }

  async function registerStockUse(event) {
    event.preventDefault();
    await runSaving(async () => {
      setError("");
      try {
        const result = await api.createDiaryEntry({
          plantingId: planting.id,
          entryDate: stockUse.entryDate,
          activityType: "PRODUCT_USE",
          activity: null,
          weatherCondition: null,
          appliedProducts: null,
          products: [],
          observations: stockUse.observations || null,
          rainfallMillimeters: null,
          productId: stockUse.productId,
          productName: null,
          productType: null,
          quantity: Number(stockUse.quantity),
          unit: null,
          supplier: null,
          amount: null,
          machineId: null,
          harvestQuantity: null,
          harvestUnit: null,
        });
        setStockUse({ ...emptyStockUse, entryDate: toInputDate() });
        setShowExpenseForm(false);
        setSuccess(
          mutationFeedback(
            result,
            "Produto usado e custo transferido para o plantio.",
          ),
        );
        if (isOfflineResult(result)) return;
        await load();
        await onChanged();
      } catch (requestError) {
        setError(requestError.message);
      }
    });
  }

  async function updateClosing(event) {
    event.preventDefault();
    await runClosing(async () => {
      try {
        const closing = await api.saveSeasonClosingPrice(
          planting.id,
          Number(salePrice),
        );
        setSuccess(
          mutationFeedback(
            closing,
            "Preço projetado salvo no fechamento da safra.",
          ),
        );
        if (isOfflineResult(closing)) return;
        setData((current) => ({ ...current, closing }));
        setSalePrice(closing.salePricePerUnit ?? "");
        setError("");
      } catch (requestError) {
        setError(requestError.message);
      }
    });
  }

  return (
    <Modal
      title={`${planting.crop} — ${planting.harvest}`}
      description={`${formatNumber(planting.plannedAreaHectares)} ha previstos · iniciado em ${formatDate(planting.startDate)}`}
      onClose={onClose}
      dismissible={!saving && !closingLoading}
      size="wide"
    >
      <div className="planting-detail">
        <ErrorBanner message={error} onDismiss={() => setError("")} />
        <SuccessBanner message={success} onDismiss={() => setSuccess("")} />
        {loading && !data ? (
          <LoadingState label="Carregando o plantio..." />
        ) : !data ? (
          <InlineErrorState message={loadError} onRetry={load} />
        ) : (
          <>
            {loadError && (
              <InlineErrorState message={loadError} onRetry={load} />
            )}
            {loading && (
              <InlineLoadingState label="Atualizando informações do plantio..." />
            )}
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
            {data.productionStock && (
              <ProductionSalesSection
                stock={data.productionStock}
                sales={data.productionSales}
                onChanged={refreshProduction}
              />
            )}
            {data.closing ? (
              <SeasonClosingPanel
                closing={data.closing}
                salePrice={salePrice}
                loading={closingLoading}
                onSalePriceChange={(event) => setSalePrice(event.target.value)}
                onSubmit={updateClosing}
              />
            ) : (
              <section>
                <h3>Fechamento de safra</h3>
                <p className="muted-copy">
                  O fechamento não está disponível no momento. Tente atualizar
                  as informações acima.
                </p>
              </section>
            )}
            <PlantingExpensesSection
              expenses={data.expenses}
              expense={expense}
              stockUse={stockUse}
              inventoryProducts={data.inventoryProducts}
              formMode={expenseFormMode}
              formOpen={showExpenseForm}
              saving={saving}
              onExpenseChange={setExpense}
              onStockUseChange={setStockUse}
              onFormModeChange={setExpenseFormMode}
              onToggleForm={() => setShowExpenseForm(!showExpenseForm)}
              onSubmit={registerExpense}
              onStockSubmit={registerStockUse}
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
