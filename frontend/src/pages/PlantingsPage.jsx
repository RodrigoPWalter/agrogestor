import { Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { PlantingDetailsModal } from "../components/PlantingDetailsModal";
import { PlantingFormModal } from "../components/plantings/PlantingFormModal";
import { PlantingList } from "../components/plantings/PlantingList";
import { PlantingsToolbar } from "../components/plantings/PlantingsToolbar";
import { toInputDate } from "../utils/formatters";
import { buildPlantingExpenseSummaries } from "../utils/plantingSummaries";
import { useSingleFlight } from "../hooks/useSingleFlight";
import { useLatestRequestGuard } from "../hooks/useLatestRequestGuard";
import {
  clearFormDraft,
  readFormDraft,
  writeFormDraft,
} from "../utils/formDraft";
import { mutationFeedback } from "../offline/offlineFeedback";
import { isOfflineResult } from "../offline/offlineSync";

const emptyForm = {
  crop: "",
  harvest: "",
  fieldName: "",
  plannedAreaHectares: "",
  rowSpacingCentimeters: "",
  startDate: toInputDate(),
  seedVariety: "",
  seedRate: "",
  seedRateUnit: "",
  observations: "",
};

export function PlantingsPage() {
  const requestConfirmation = useConfirmation();
  const [plantings, setPlantings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offlineDataUnavailable, setOfflineDataUnavailable] = useState(false);
  const { pending: saving, run: runSaving } = useSingleFlight();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [view, setView] = useState("active");
  const [summaries, setSummaries] = useState({});
  const [selectedPlanting, setSelectedPlanting] = useState(null);
  const [draftRecovered, setDraftRecovered] = useState(false);
  const beginPlantingsRequest = useLatestRequestGuard();

  const loadPlantings = useCallback(
    async ({ showLoading = true } = {}) => {
      const isCurrentRequest = beginPlantingsRequest();
      if (showLoading) setLoading(true);
      try {
        const [page, expensePage] = await Promise.all([
          view === "active" ? api.getPlantings() : api.getPlantingHistory(),
          api.getExpenses(),
        ]);
        if (isCurrentRequest()) {
          setPlantings(page.content);
          setSummaries(
            buildPlantingExpenseSummaries(page.content, expensePage.content),
          );
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
    [beginPlantingsRequest, view],
  );

  useEffect(() => {
    loadPlantings();
  }, [loadPlantings]);

  useEffect(() => {
    if (modalOpen && !editing) {
      writeFormDraft("plantio", form);
    }
  }, [editing, form, modalOpen]);

  const filteredPlantings = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    if (!term) return plantings;
    return plantings.filter((item) =>
      [item.crop, item.harvest, item.seedVariety].some((value) =>
        value.toLocaleLowerCase("pt-BR").includes(term),
      ),
    );
  }, [plantings, search]);

  function openCreate() {
    const draft = readFormDraft("plantio");
    setEditing(null);
    setForm({ ...emptyForm, startDate: toInputDate(), ...draft });
    setDraftRecovered(Boolean(draft));
    setModalOpen(true);
    setError("");
  }

  function openEdit(planting) {
    setDraftRecovered(false);
    setEditing(planting);
    setForm({
      crop: planting.crop,
      harvest: planting.harvest,
      fieldName: planting.fieldName || "",
      plannedAreaHectares: planting.plannedAreaHectares,
      rowSpacingCentimeters: planting.rowSpacingCentimeters ?? "",
      startDate: planting.startDate,
      seedVariety: planting.seedVariety,
      seedRate: planting.seedRate ?? planting.seedQuantity,
      seedRateUnit: planting.seedRateUnit || "",
      observations: planting.observations || "",
    });
    setModalOpen(true);
    setError("");
  }

  function closeForm() {
    if (!editing) clearFormDraft("plantio");
    setDraftRecovered(false);
    setModalOpen(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await runSaving(async () => {
      setError("");
      const payload = {
        ...form,
        fieldName: form.fieldName || null,
        plannedAreaHectares: Number(form.plannedAreaHectares),
        rowSpacingCentimeters: form.rowSpacingCentimeters
          ? Number(form.rowSpacingCentimeters)
          : null,
        seedRate: Number(form.seedRate),
        observations: form.observations || null,
      };
      try {
        let result;
        if (editing) {
          result = await api.updatePlanting(editing.id, payload);
          setSuccess(
            mutationFeedback(result, "Plantio atualizado com sucesso."),
          );
        } else {
          result = await api.createPlanting(payload);
          clearFormDraft("plantio");
          setDraftRecovered(false);
          setSuccess(
            mutationFeedback(result, "Plantio cadastrado com sucesso."),
          );
        }
        setModalOpen(false);
        if (isOfflineResult(result)) return;
        await loadPlantings({ showLoading: false });
      } catch (requestError) {
        setError(requestError.message);
      }
    });
  }

  async function handleDelete(planting) {
    const confirmed = await requestConfirmation({
      title: "Excluir plantio?",
      description: `O plantio de ${planting.crop} será excluído permanentemente.`,
      detail: "Todos os registros vinculados também poderão ser removidos.",
      confirmLabel: "Excluir plantio",
    });
    if (!confirmed) return;
    setError("");
    try {
      const result = await api.deletePlanting(planting.id);
      setSuccess(mutationFeedback(result, "Plantio excluído."));
      if (isOfflineResult(result)) return;
      await loadPlantings({ showLoading: false });
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleFinish(planting) {
    const confirmed = await requestConfirmation({
      title: "Finalizar plantio?",
      description: `A safra de ${planting.crop} será movida para o histórico.`,
      detail: "Você poderá reativá-la depois, se necessário.",
      confirmLabel: "Finalizar plantio",
      tone: "primary",
    });
    if (!confirmed) return;
    try {
      const result = await api.finishPlanting(planting.id);
      setSelectedPlanting(null);
      setSuccess(
        mutationFeedback(result, "Safra finalizada e movida para o histórico."),
      );
      if (isOfflineResult(result)) return;
      await loadPlantings({ showLoading: false });
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleReactivate(planting) {
    const confirmed = await requestConfirmation({
      title: "Reativar plantio?",
      description: `O plantio de ${planting.crop} voltará para a lista de plantios ativos.`,
      confirmLabel: "Reativar plantio",
      tone: "primary",
    });
    if (!confirmed) return;
    try {
      const result = await api.reactivatePlanting(planting.id);
      setSuccess(
        mutationFeedback(
          result,
          "Plantio reativado e devolvido para a lista de ativos.",
        ),
      );
      setSelectedPlanting(null);
      if (isOfflineResult(result)) return;
      await loadPlantings({ showLoading: false });
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Safras e culturas"
        title="Plantios"
        description="Planeje a safra e acompanhe os hectares plantados a cada dia."
        action={
          <button className="button button--primary" onClick={openCreate}>
            <Plus size={18} /> Novo plantio
          </button>
        }
      />

      <ErrorBanner message={error} onDismiss={() => setError("")} />
      <SuccessBanner message={success} onDismiss={() => setSuccess("")} />

      {!offlineDataUnavailable && (
        <PlantingsToolbar
          view={view}
          search={search}
          recordCount={filteredPlantings.length}
          onViewChange={setView}
          onSearchChange={(event) => setSearch(event.target.value)}
        />
      )}

      {offlineDataUnavailable ? (
        <OfflineDataState onRetry={() => loadPlantings()} />
      ) : loading ? (
        <LoadingState />
      ) : filteredPlantings.length === 0 ? (
        <EmptyState
          title={
            search
              ? "Nenhum plantio encontrado"
              : "Comece pelo primeiro plantio"
          }
          description={
            search
              ? "Tente buscar usando outra palavra."
              : "Cadastre uma cultura para organizar a safra."
          }
          action={
            !search && (
              <button className="button button--primary" onClick={openCreate}>
                <Plus size={18} /> Cadastrar plantio
              </button>
            )
          }
        />
      ) : (
        <PlantingList
          plantings={filteredPlantings}
          summaries={summaries}
          view={view}
          onOpen={setSelectedPlanting}
          onEdit={openEdit}
          onDelete={handleDelete}
          onFinish={handleFinish}
          onReactivate={handleReactivate}
        />
      )}

      {selectedPlanting && (
        <PlantingDetailsModal
          planting={selectedPlanting}
          onClose={() => setSelectedPlanting(null)}
          onFinish={handleFinish}
          onReactivate={handleReactivate}
          onChanged={() => loadPlantings({ showLoading: false })}
        />
      )}

      {modalOpen && (
        <PlantingFormModal
          editing={Boolean(editing)}
          form={form}
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
