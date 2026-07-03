import {
  CalendarDays,
  CheckCircle2,
  Edit3,
  History,
  Plus,
  Search,
  Sprout,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import {
  EmptyState,
  ErrorBanner,
  LoadingState,
  SuccessBanner,
} from "../components/Feedback";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { PlantingDetailsModal } from "../components/PlantingDetailsModal";
import { PlantingSummaryCard } from "../components/PlantingSummaryCard";
import { formatDate, formatNumber, toInputDate } from "../utils/formatters";

const emptyForm = {
  crop: "",
  harvest: "",
  plantedAreaHectares: "",
  plantingDate: toInputDate(),
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

  const loadPlantings = useCallback(async () => {
    setLoading(true);
    try {
      const page =
        view === "active"
          ? await api.getPlantings()
          : await api.getPlantingHistory();
      setPlantings(page.content);
      const results = await Promise.all(
        page.content.map(async (planting) => {
          try {
            return [planting.id, await api.getExpenseSummary(planting.id)];
          } catch {
            return [planting.id, null];
          }
        }),
      );
      setSummaries(Object.fromEntries(results));
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [view]);

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
    setForm({ ...emptyForm, plantingDate: toInputDate() });
    setModalOpen(true);
    setError("");
  }

  function openEdit(planting) {
    setEditing(planting);
    setForm({
      crop: planting.crop,
      harvest: planting.harvest,
      plantedAreaHectares: planting.plantedAreaHectares,
      plantingDate: planting.plantingDate,
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
      plantedAreaHectares: Number(form.plantedAreaHectares),
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
      await loadPlantings();
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
      await loadPlantings();
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
      await loadPlantings();
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
      await loadPlantings();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Safras e culturas"
        title="Plantios"
        description="Acompanhe tudo que foi plantado na propriedade."
        action={
          <button className="button button--primary" onClick={openCreate}>
            <Plus size={18} /> Novo plantio
          </button>
        }
      />

      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      <div className="planting-tabs">
        <button
          className={view === "active" ? "is-active" : ""}
          onClick={() => setView("active")}
        >
          <Sprout size={17} /> Plantios ativos
        </button>
        <button
          className={view === "history" ? "is-active" : ""}
          onClick={() => setView("history")}
        >
          <History size={17} /> Histórico de safras
        </button>
      </div>

      <div className="toolbar">
        <label className="search-box">
          <Search size={19} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por cultura, safra ou variedade"
          />
        </label>
        <span className="record-count">
          {filteredPlantings.length}{" "}
          {filteredPlantings.length === 1 ? "registro" : "registros"}
        </span>
      </div>

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
        <div className="data-card-grid">
          {filteredPlantings.map((planting) => (
            <article key={planting.id} className="data-card">
              <div className="data-card__header">
                <span className="crop-avatar crop-avatar--large">
                  <Sprout size={22} />
                </span>
                <div>
                  <h2>{planting.crop}</h2>
                  <span className="badge">{planting.harvest}</span>
                </div>
                <div className="card-actions">
                  {view === "active" && (
                    <button
                      className="icon-button icon-button--success"
                      onClick={() => handleFinish(planting)}
                      aria-label="Finalizar plantio"
                    >
                      <CheckCircle2 size={18} />
                    </button>
                  )}
                  {view === "history" && (
                    <button
                      className="icon-button icon-button--success"
                      onClick={() => handleReactivate(planting)}
                      aria-label="Reativar plantio"
                    >
                      <History size={18} />
                    </button>
                  )}
                  <button
                    className="icon-button"
                    onClick={() => openEdit(planting)}
                    aria-label="Editar plantio"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button
                    className="icon-button icon-button--danger"
                    onClick={() => handleDelete(planting)}
                    aria-label="Excluir plantio"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="data-card__metric">
                <strong>{formatNumber(planting.plantedAreaHectares)} ha</strong>
                <span>Área plantada</span>
              </div>
              <PlantingSummaryCard summary={summaries[planting.id]} />
              <dl className="details-list">
                {planting.completedAt && (
                  <div>
                    <dt>Finalizado</dt>
                    <dd>{formatDate(planting.completedAt.slice(0, 10))}</dd>
                  </div>
                )}
                <div>
                  <dt>Variedade</dt>
                  <dd>{planting.seedVariety}</dd>
                </div>
                <div>
                  <dt>Sementes</dt>
                  <dd>{formatNumber(planting.seedQuantity, 3)}</dd>
                </div>
                <div>
                  <dt>
                    <CalendarDays size={15} /> Data
                  </dt>
                  <dd>{formatDate(planting.plantingDate)}</dd>
                </div>
              </dl>
              {planting.observations && (
                <p className="card-note">{planting.observations}</p>
              )}
              <div className="planting-card-actions">
                <button
                  className="button button--ghost"
                  onClick={() => setSelectedPlanting(planting)}
                >
                  Abrir plantio
                </button>
                {view === "history" && (
                  <button
                    className="button button--primary"
                    onClick={() => handleReactivate(planting)}
                  >
                    Reativar plantio
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {selectedPlanting && (
        <PlantingDetailsModal
          planting={selectedPlanting}
          onClose={() => setSelectedPlanting(null)}
          onFinish={handleFinish}
          onReactivate={handleReactivate}
          onChanged={loadPlantings}
        />
      )}

      {modalOpen && (
        <Modal
          title={editing ? "Editar plantio" : "Novo plantio"}
          description="Preencha os dados principais da lavoura."
          onClose={() => setModalOpen(false)}
        >
          <form className="form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                <span>Cultura</span>
                <input
                  required
                  maxLength="80"
                  value={form.crop}
                  onChange={(event) =>
                    setForm({ ...form, crop: event.target.value })
                  }
                  placeholder="Ex.: Soja"
                />
              </label>
              <label>
                <span>Safra</span>
                <input
                  required
                  pattern="(\d{4}|\d{4}/\d{4})"
                  title="Use apenas um ano, como 2026, ou o formato 2026/2027"
                  value={form.harvest}
                  onChange={(event) =>
                    setForm({ ...form, harvest: event.target.value })
                  }
                  placeholder="2026 ou 2026/2027"
                />
              </label>
              <label>
                <span>Área plantada (ha)</span>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.plantedAreaHectares}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      plantedAreaHectares: event.target.value,
                    })
                  }
                  placeholder="18,50"
                />
              </label>
              <label>
                <span>Data do plantio</span>
                <input
                  required
                  type="date"
                  value={form.plantingDate}
                  onChange={(event) =>
                    setForm({ ...form, plantingDate: event.target.value })
                  }
                />
              </label>
              <label>
                <span>Variedade da semente</span>
                <input
                  required
                  maxLength="120"
                  value={form.seedVariety}
                  onChange={(event) =>
                    setForm({ ...form, seedVariety: event.target.value })
                  }
                  placeholder="Ex.: BRS 284"
                />
              </label>
              <label>
                <span>Quantidade de sementes</span>
                <input
                  required
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={form.seedQuantity}
                  onChange={(event) =>
                    setForm({ ...form, seedQuantity: event.target.value })
                  }
                  placeholder="925"
                />
              </label>
              <label className="form-grid__full">
                <span>
                  Observações <small>(opcional)</small>
                </span>
                <textarea
                  maxLength="1000"
                  rows="3"
                  value={form.observations}
                  onChange={(event) =>
                    setForm({ ...form, observations: event.target.value })
                  }
                  placeholder="Ex.: Talhão norte"
                />
              </label>
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="button button--primary"
                disabled={saving}
              >
                {saving
                  ? "Salvando..."
                  : editing
                    ? "Salvar alterações"
                    : "Cadastrar plantio"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
