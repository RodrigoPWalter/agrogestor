import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { useConfirmation } from "../components/ConfirmationProvider";
import {
  EmptyState,
  ErrorBanner,
  LoadingState,
  SuccessBanner,
} from "../components/Feedback";
import { PageHeader } from "../components/PageHeader";
import { DiaryFilter } from "../components/diary/DiaryFilter";
import { DiaryFormModal } from "../components/diary/DiaryFormModal";
import { DiaryTimeline } from "../components/diary/DiaryTimeline";
import { toInputDate } from "../utils/formatters";

const activityTypes = [
  { value: "INSPECTION", label: "Vistoria" },
  { value: "RAIN", label: "Chuva" },
  { value: "PRODUCT_PURCHASE", label: "Compra de produto" },
  { value: "PRODUCT_USE", label: "Uso de produto" },
  { value: "MAINTENANCE", label: "Manutenção" },
  { value: "OBSERVATION", label: "Observação" },
  { value: "HARVEST", label: "Colheita" },
  { value: "OTHER", label: "Outro" },
];

function emptyForm(plantingId = "") {
  return {
    plantingId,
    entryDate: toInputDate(),
    activityType: "INSPECTION",
    activity: "",
    weatherCondition: "",
    appliedProducts: "",
    products: [],
    observations: "",
    rainfallMillimeters: "",
    productId: "",
    productName: "",
    productType: "PESTICIDE",
    quantity: "",
    unit: "LITER",
    supplier: "",
    amount: "",
    machineId: "",
    harvestQuantity: "",
    harvestUnit: "Sacas",
  };
}

export function FieldDiaryPage() {
  const requestConfirmation = useConfirmation();
  const [plantings, setPlantings] = useState([]);
  const [entries, setEntries] = useState([]);
  const [inventoryProducts, setInventoryProducts] = useState([]);
  const [machines, setMachines] = useState([]);
  const [selectedPlantingId, setSelectedPlantingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [searchParams, setSearchParams] = useSearchParams();

  const loadEntries = useCallback(
    async (plantingId, { showLoading = true } = {}) => {
      if (showLoading) setLoading(true);
      try {
        const page = await api.getDiaryEntries(plantingId);
        setEntries(page.content);
        setError("");
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    api
      .getAllPlantings()
      .then((page) => setPlantings(page.content))
      .catch((requestError) => setError(requestError.message));
    api
      .getInventoryProducts()
      .then(setInventoryProducts)
      .catch(() => {});
    api
      .getMachines()
      .then(setMachines)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const quickType = searchParams.get("new");
    if (!quickType || plantings.length === 0) return;

    setEditing(null);
    setForm({
      ...emptyForm(searchParams.get("plantingId") || ""),
      activityType: quickType === "rain" ? "RAIN" : "OBSERVATION",
    });
    setModalOpen(true);
    setSearchParams({});
  }, [plantings, searchParams, setSearchParams]);

  useEffect(() => {
    loadEntries(selectedPlantingId);
  }, [selectedPlantingId, loadEntries]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm(selectedPlantingId));
    setModalOpen(true);
    setError("");
  }

  function openEdit(entry) {
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
      machineId: entry.machineId || "",
      harvestQuantity: entry.harvestQuantity || "",
      harvestUnit: entry.harvestUnit || "Sacas",
    });
    setModalOpen(true);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
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
      machineId: form.machineId || null,
      harvestQuantity: form.harvestQuantity
        ? Number(form.harvestQuantity)
        : null,
    };

    try {
      if (editing) {
        await api.updateDiaryEntry(editing.id, payload);
        setSuccess("Registro e estoque atualizados.");
      } else {
        await api.createDiaryEntry(payload);
        setSuccess(
          "Acontecimento registrado e módulos relacionados atualizados.",
        );
      }
      setModalOpen(false);
      await loadEntries(selectedPlantingId, { showLoading: false });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(entry) {
    const confirmed = await requestConfirmation({
      title: "Excluir registro do diário?",
      description: `O registro “${entry.activity}” será excluído.`,
      detail:
        "Se houver produtos usados neste lançamento, as quantidades serão devolvidas ao estoque.",
      confirmLabel: "Excluir registro",
    });
    if (!confirmed) return;

    try {
      await api.deleteDiaryEntry(entry.id);
      setSuccess("Registro excluído e produtos devolvidos ao estoque.");
      await loadEntries(selectedPlantingId, { showLoading: false });
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Rotina de campo"
        title="Diário da lavoura"
        description="Registre rapidamente o que aconteceu no plantio ou na propriedade."
        action={
          <button className="button button--primary" onClick={openCreate}>
            <Plus size={18} /> Nova atividade
          </button>
        }
      />

      <ErrorBanner message={error} onDismiss={() => setError("")} />
      <SuccessBanner message={success} onDismiss={() => setSuccess("")} />
      <DiaryFilter
        plantings={plantings}
        selectedPlantingId={selectedPlantingId}
        entryCount={entries.length}
        onChange={(event) => setSelectedPlantingId(event.target.value)}
      />

      {loading ? (
        <LoadingState label="Abrindo o diário..." />
      ) : entries.length === 0 ? (
        <EmptyState
          title="Nenhuma atividade registrada"
          description="Anote uma vistoria, chuva, compra, manutenção ou observação."
          action={
            <button className="button button--primary" onClick={openCreate}>
              <Plus size={18} /> Registrar atividade
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
          activityTypes={activityTypes}
          today={toInputDate()}
          saving={saving}
          onChange={setForm}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
