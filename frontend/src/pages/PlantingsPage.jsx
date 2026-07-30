import { Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import {
  EmptyState,
  ErrorBanner,
  LoadingState,
  SuccessBanner,
} from "../components/Feedback";
import { PageHeader } from "../components/PageHeader";
import { PlantingDetailsModal } from "../components/PlantingDetailsModal";
import { PlantingFormModal } from "../components/plantings/PlantingFormModal";
import { PlantingList } from "../components/plantings/PlantingList";
import { PlantingsToolbar } from "../components/plantings/PlantingsToolbar";
import { toInputDate } from "../utils/formatters";
import { buildPlantingExpenseSummaries } from "../utils/plantingSummaries";

const emptyForm = {
  crop: "",
  harvest: "",
  fieldName: "",
  plannedAreaHectares: "",
  rowSpacingCentimeters: "",
  startDate: toInputDate(),
  seedVariety: "",
  seedQuantity: "",
  observations: "",
};

export function PlantingsPage() {
  const [plantings, setPlantings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [view, setView] = useState("active");
  const [summaries, setSummaries] = useState({});
  const [selectedPlanting, setSelectedPlanting] = useState(null);

  const loadPlantings = useCallback(
    async ({ showLoading = true } = {}) => {
      if (showLoading) setLoading(true);
      try {
        const [page, expensePage] = await Promise.all([
          view === "active" ? api.getPlantings() : api.getPlantingHistory(),
          api.getExpenses(),
        ]);
        setPlantings(page.content);
        setSummaries(
          buildPlantingExpenseSummaries(page.content, expensePage.content),
        );
        setError("");
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [view],
  );

  useEffect(() => {
    loadPlantings();
  }, [loadPlantings]);

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
    setEditing(null);
    setForm({ ...emptyForm, startDate: toInputDate() });
    setModalOpen(true);
    setError("");
  }

  function openEdit(planting) {
    setEditing(planting);
    setForm({
      crop: planting.crop,
      harvest: planting.harvest,
      fieldName: planting.fieldName || "",
      plannedAreaHectares: planting.plannedAreaHectares,
      rowSpacingCentimeters: planting.rowSpacingCentimeters ?? "",
      startDate: planting.startDate,
      seedVariety: planting.seedVariety,
      seedQuantity: planting.seedQuantity,
      observations: planting.observations || "",
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
      fieldName: form.fieldName || null,
      plannedAreaHectares: Number(form.plannedAreaHectares),
      rowSpacingCentimeters: form.rowSpacingCentimeters
        ? Number(form.rowSpacingCentimeters)
        : null,
      seedQuantity: Number(form.seedQuantity),
      observations: form.observations || null,
    };
    try {
      if (editing) {
        await api.updatePlanting(editing.id, payload);
        setSuccess("Plantio atualizado com sucesso.");
      } else {
        await api.createPlanting(payload);
        setSuccess("Plantio cadastrado com sucesso.");
      }
      setModalOpen(false);
      await loadPlantings({ showLoading: false });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(planting) {
    if (!window.confirm(`Excluir o plantio de ${planting.crop}?`)) return;
    setError("");
    try {
      await api.deletePlanting(planting.id);
      setSuccess("Plantio excluído.");
      await loadPlantings({ showLoading: false });
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleFinish(planting) {
    if (
      !window.confirm(`Finalizar o plantio de ${planting.crop} como colhido?`)
    )
      return;
    try {
      await api.finishPlanting(planting.id);
      setSelectedPlanting(null);
      setSuccess("Plantio finalizado e movido para o histórico.");
      await loadPlantings({ showLoading: false });
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleReactivate(planting) {
    if (
      !window.confirm(
        `Reativar o plantio de ${planting.crop}? Ele voltará para a lista de plantios ativos.`,
      )
    )
      return;
    try {
      await api.reactivatePlanting(planting.id);
      setSuccess("Plantio reativado e devolvido para a lista de ativos.");
      setSelectedPlanting(null);
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

      <PlantingsToolbar
        view={view}
        search={search}
        recordCount={filteredPlantings.length}
        onViewChange={setView}
        onSearchChange={(event) => setSearch(event.target.value)}
      />

      {loading ? (
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
          onChange={setForm}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
