import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { useConfirmation } from "../components/ConfirmationProvider";
import {
  EmptyState,
  ErrorBanner,
  LoadingState,
  OfflineDataState,
  SuccessBanner,
} from "../components/Feedback";
import { PageHeader } from "../components/PageHeader";
import { DiaryFilter } from "../components/diary/DiaryFilter";
import { DiaryFormModal } from "../components/diary/DiaryFormModal";
import { DiaryQuickLaunch } from "../components/diary/DiaryQuickLaunch";
import { DiaryTimeline } from "../components/diary/DiaryTimeline";
import {
  diaryActivityTypes,
  newDiaryForm,
} from "../components/diary/diaryForm";
import { useSingleFlight } from "../hooks/useSingleFlight";
import { mutationFeedback } from "../offline/offlineFeedback";
import { isOfflineResult } from "../offline/offlineSync";
import { useLatestRequestGuard } from "../hooks/useLatestRequestGuard";
import { useOfflineRefresh } from "../hooks/useOfflineRefresh";
import {
  clearFormDraft,
  readFormDraft,
  writeFormDraft,
} from "../utils/formDraft";
import { toInputDate } from "../utils/formatters";

export function FieldDiaryPage() {
  const requestConfirmation = useConfirmation();
  const [plantings, setPlantings] = useState([]);
  const [entries, setEntries] = useState([]);
  const [inventoryProducts, setInventoryProducts] = useState([]);
  const [machines, setMachines] = useState([]);
  const [selectedPlantingId, setSelectedPlantingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [offlineDataUnavailable, setOfflineDataUnavailable] = useState(false);
  const { pending: saving, run: runSaving } = useSingleFlight();
  const [error, setError] = useState("");
  const [referenceWarning, setReferenceWarning] = useState("");
  const [success, setSuccess] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(newDiaryForm());
  const [searchParams, setSearchParams] = useSearchParams();
  const [draftRecovered, setDraftRecovered] = useState(false);
  const beginEntriesRequest = useLatestRequestGuard();

  const loadEntries = useCallback(
    async (plantingId, { showLoading = true } = {}) => {
      const isCurrentRequest = beginEntriesRequest();
      if (showLoading) setLoading(true);
      try {
        const page = await api.getDiaryEntries(plantingId);
        if (isCurrentRequest()) {
          setEntries(page.content);
          setOfflineDataUnavailable(false);
          setError("");
        }
      } catch (requestError) {
        if (isCurrentRequest()) {
          setOfflineDataUnavailable(Boolean(requestError.offlineCacheMiss));
          setError(requestError.offlineCacheMiss ? "" : requestError.message);
        }
      } finally {
        if (showLoading && isCurrentRequest()) setLoading(false);
      }
    },
    [beginEntriesRequest],
  );

  useEffect(() => {
    let active = true;

    Promise.allSettled([
      api.getAllPlantings(),
      api.getInventoryProducts(),
      api.getMachines(),
    ]).then(([plantingResult, inventoryResult, machineResult]) => {
      if (!active) return;

      if (plantingResult.status === "fulfilled") {
        setPlantings(plantingResult.value.content);
      }
      if (inventoryResult.status === "fulfilled") {
        setInventoryProducts(inventoryResult.value);
      }
      if (machineResult.status === "fulfilled") {
        setMachines(machineResult.value);
      }

      const unavailable = [
        plantingResult.status === "rejected" ? "plantios" : null,
        inventoryResult.status === "rejected" ? "estoque" : null,
        machineResult.status === "rejected" ? "máquinas" : null,
      ].filter(Boolean);

      setReferenceWarning(
        unavailable.length > 0
          ? `O Diário está disponível, mas não foi possível carregar: ${unavailable.join(", ")}. Algumas opções do formulário podem ficar indisponíveis.`
          : "",
      );
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const quickType = searchParams.get("new");
    if (!quickType) return;

    setEditing(null);
    setForm({
      ...newDiaryForm(searchParams.get("plantingId") || ""),
      activityType: quickType === "rain" ? "RAIN" : "OBSERVATION",
    });
    setDraftRecovered(false);
    setModalOpen(true);
    setSearchParams({});
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    loadEntries(selectedPlantingId);
  }, [selectedPlantingId, loadEntries]);

  useOfflineRefresh(() =>
    loadEntries(selectedPlantingId, { showLoading: false }),
  );

  useEffect(() => {
    if (modalOpen && !editing) {
      writeFormDraft("diario", form);
    }
  }, [editing, form, modalOpen]);

  function openCreate(activityType = "") {
    const draft = readFormDraft("diario");
    const recoveredDraft =
      draft?.activityType === "INSPECTION"
        ? { ...draft, activityType: "OBSERVATION", activity: "" }
        : draft;
    const shouldRecoverDraft =
      recoveredDraft &&
      (!activityType || recoveredDraft.activityType === activityType);
    setEditing(null);
    setForm({
      ...newDiaryForm(selectedPlantingId),
      ...(shouldRecoverDraft ? recoveredDraft : {}),
      ...(activityType ? { activityType } : {}),
    });
    setDraftRecovered(Boolean(shouldRecoverDraft));
    setModalOpen(true);
    setError("");
  }

  function openEdit(entry) {
    setDraftRecovered(false);
    setEditing(entry);
    setForm({
      plantingId: entry.plantingId,
      entryDate: entry.entryDate,
      activityType: entry.activityType,
      activity: entry.activity,
      weatherCondition: entry.weatherCondition || "",
      appliedProducts: entry.appliedProducts || "",
      products: entry.products || [],
      observations: entry.observations || "",
      rainfallMillimeters: entry.rainfallMillimeters || "",
      productId: "",
      productName: "",
      productType: "PESTICIDE",
      quantity: "",
      unit: "LITER",
      supplier: entry.supplier || "",
      amount: entry.amount || "",
      expenseCategory: entry.expenseCategory || "OTHER",
      fuelLiters: entry.fuelLiters || "",
      machineId: entry.machineId || "",
      operationAreaHectares: entry.operationAreaHectares || "",
      operationSeedVariety: entry.operationSeedVariety || "",
      operationStartTime: entry.operationStartTime || "",
      operationEndTime: entry.operationEndTime || "",
      harvestQuantity: entry.harvestQuantity || "",
      harvestUnit:
        entry.operationHarvestUnit || entry.harvestUnit || "BAGS_60_KG",
      saleQuantityBags:
        entry.activityType === "SALE" ? entry.harvestQuantity || "" : "",
      salePricePerBag: entry.salePricePerBag || "",
      buyer: entry.activityType === "SALE" ? entry.supplier || "" : "",
    });
    setModalOpen(true);
    setError("");
  }

  function closeForm() {
    if (!editing) clearFormDraft("diario");
    setDraftRecovered(false);
    setModalOpen(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await runSaving(async () => {
      setError("");
      const operationPayload = {
        seedVariety: form.operationSeedVariety || null,
        startTime: form.operationStartTime || null,
        endTime: form.operationEndTime || null,
        observations: form.observations || null,
      };
      const isPlantingOperation =
        form.activityType === "PLANTING" &&
        (!editing || Boolean(editing.operationStepId));
      const isHarvestOperation =
        form.activityType === "HARVEST" &&
        (!editing || Boolean(editing.operationStepId));
      const payload = {
        ...form,
        plantingId: form.plantingId || null,
        weatherCondition: form.weatherCondition || null,
        appliedProducts: form.appliedProducts || null,
        products: form.products
          .filter((item) => item.productId && Number(item.quantity) > 0)
          .map((item) => ({
            productId: item.productId,
            quantity: Number(item.quantity),
          })),
        observations: form.observations || null,
        rainfallMillimeters: form.rainfallMillimeters
          ? Number(form.rainfallMillimeters)
          : null,
        productId: form.productId || null,
        productName: form.productName || null,
        quantity: form.quantity ? Number(form.quantity) : null,
        supplier: form.supplier || null,
        amount: form.amount ? Number(form.amount) : null,
        expenseCategory: form.expenseCategory || null,
        fuelLiters: form.fuelLiters ? Number(form.fuelLiters) : null,
        machineId: form.machineId || null,
        harvestQuantity: form.harvestQuantity
          ? Number(form.harvestQuantity)
          : null,
        saleQuantityBags: form.saleQuantityBags
          ? Number(form.saleQuantityBags)
          : null,
        salePricePerBag: form.salePricePerBag
          ? Number(form.salePricePerBag)
          : null,
        buyer: form.buyer || null,
      };

      try {
        if (isPlantingOperation) {
          const stepPayload = {
            ...operationPayload,
            stepDate: form.entryDate,
            plantedAreaHectares: Number(form.operationAreaHectares),
          };
          const result = editing
            ? await api.updatePlantingStep(
                form.plantingId,
                editing.operationStepId,
                stepPayload,
              )
            : await api.createPlantingStep(form.plantingId, stepPayload);
          if (!editing) {
            clearFormDraft("diario");
            setDraftRecovered(false);
          }
          setSuccess(
            mutationFeedback(
              result,
              "Etapa de plantio e progresso atualizados.",
            ),
          );
          if (isOfflineResult(result)) {
            setModalOpen(false);
            return;
          }
        } else if (isHarvestOperation) {
          const stepPayload = {
            ...operationPayload,
            harvestDate: form.entryDate,
            harvestedAreaHectares: Number(form.operationAreaHectares),
            harvestQuantity: Number(form.harvestQuantity),
            harvestUnit: form.harvestUnit,
          };
          const result = editing
            ? await api.updateHarvestStep(
                form.plantingId,
                editing.operationStepId,
                stepPayload,
              )
            : await api.createHarvestStep(form.plantingId, stepPayload);
          if (!editing) {
            clearFormDraft("diario");
            setDraftRecovered(false);
          }
          setSuccess(
            mutationFeedback(
              result,
              "Etapa de colheita e progresso atualizados.",
            ),
          );
          if (isOfflineResult(result)) {
            setModalOpen(false);
            return;
          }
        } else if (editing) {
          const result = await api.updateDiaryEntry(editing.id, payload);
          setSuccess(
            mutationFeedback(result, "Registro e estoque atualizados."),
          );
          if (isOfflineResult(result)) {
            setModalOpen(false);
            return;
          }
        } else {
          const result = await api.createDiaryEntry(payload);
          clearFormDraft("diario");
          setDraftRecovered(false);
          setSuccess(
            mutationFeedback(
              result,
              "Acontecimento registrado e módulos relacionados atualizados.",
            ),
          );
          if (isOfflineResult(result)) {
            setModalOpen(false);
            return;
          }
        }
        setModalOpen(false);
        const [plantingPage] = await Promise.all([
          api.getAllPlantings(),
          loadEntries(selectedPlantingId, { showLoading: false }),
        ]);
        setPlantings(plantingPage.content);
      } catch (requestError) {
        setError(requestError.message);
      }
    });
  }

  async function handleDelete(entry) {
    const operation = Boolean(entry.operationStepId);
    const confirmed = await requestConfirmation({
      title: operation ? "Excluir esta etapa?" : "Excluir registro do diário?",
      description: `O registro “${entry.activity}” será excluído.`,
      detail: operation
        ? "O progresso do plantio será recalculado automaticamente."
        : "Se houver produtos usados neste lançamento, as quantidades serão devolvidas ao estoque.",
      confirmLabel: operation ? "Excluir etapa" : "Excluir registro",
    });
    if (!confirmed) return;

    try {
      let result;
      if (entry.operationStepId && entry.activityType === "PLANTING") {
        result = await api.deletePlantingStep(
          entry.plantingId,
          entry.operationStepId,
        );
      } else if (entry.operationStepId && entry.activityType === "HARVEST") {
        result = await api.deleteHarvestStep(
          entry.plantingId,
          entry.operationStepId,
        );
      } else {
        result = await api.deleteDiaryEntry(entry.id);
      }
      setSuccess(
        mutationFeedback(
          result,
          operation
            ? "Etapa excluída e progresso recalculado."
            : "Registro excluído e produtos devolvidos ao estoque.",
        ),
      );
      if (isOfflineResult(result)) return;
      const [plantingPage] = await Promise.all([
        api.getAllPlantings(),
        loadEntries(selectedPlantingId, { showLoading: false }),
      ]);
      setPlantings(plantingPage.content);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Central de lançamentos"
        title="Diário"
        description="Registre o trabalho da propriedade de forma rápida e acompanhe tudo no histórico."
        action={
          <button
            className="button button--primary diary-header-action"
            onClick={() => openCreate()}
          >
            <Plus size={18} /> Novo lançamento
          </button>
        }
      />

      <ErrorBanner message={error} onDismiss={() => setError("")} />
      <ErrorBanner
        message={referenceWarning}
        onDismiss={() => setReferenceWarning("")}
      />
      <SuccessBanner message={success} onDismiss={() => setSuccess("")} />
      <DiaryQuickLaunch
        onSelect={(activityType) => openCreate(activityType)}
        onMore={() => openCreate()}
      />
      {!offlineDataUnavailable && (
        <DiaryFilter
          plantings={plantings}
          selectedPlantingId={selectedPlantingId}
          entryCount={entries.length}
          onChange={(event) => setSelectedPlantingId(event.target.value)}
        />
      )}

      {offlineDataUnavailable ? (
        <OfflineDataState onRetry={() => loadEntries(selectedPlantingId)} />
      ) : loading ? (
        <LoadingState label="Abrindo o diário..." />
      ) : entries.length === 0 ? (
        <EmptyState
          title="Nenhum lançamento registrado"
          description="Use os atalhos acima para registrar o primeiro acontecimento da propriedade."
          action={
            <button
              className="button button--primary"
              onClick={() => openCreate()}
            >
              <Plus size={18} /> Outro lançamento
            </button>
          }
        />
      ) : (
        <DiaryTimeline
          entries={entries}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}

      {modalOpen && (
        <DiaryFormModal
          editing={Boolean(editing)}
          form={form}
          plantings={plantings}
          products={inventoryProducts}
          machines={machines}
          activityTypes={
            editing?.activityType === "INSPECTION"
              ? [
                  { value: "INSPECTION", label: "Vistoria (registro antigo)" },
                  ...diaryActivityTypes,
                ]
              : diaryActivityTypes
          }
          operationManaged={Boolean(editing?.operationStepId)}
          legacyHarvest={
            editing?.activityType === "HARVEST" && !editing?.operationStepId
          }
          today={toInputDate()}
          saving={saving}
          draftRecovered={draftRecovered}
          onChange={setForm}
          onClose={closeForm}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
