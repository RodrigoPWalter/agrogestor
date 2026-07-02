import {
  BookOpenText,
  CloudSun,
  Edit3,
  FlaskConical,
  Plus,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import {
  EmptyState,
  ErrorBanner,
  LoadingState,
  SuccessBanner,
} from "../components/Feedback";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { formatDate, toInputDate } from "../utils/formatters";

const activityTypes = [
  { value: "PLANTING", label: "Plantio" },
  { value: "FERTILIZATION", label: "Adubação" },
  { value: "APPLICATION", label: "Aplicação" },
  { value: "INSPECTION", label: "Vistoria" },
  { value: "HARVEST", label: "Colheita" },
  { value: "OTHER", label: "Outra atividade" },
];

function emptyForm(plantingId = "") {
  return {
    plantingId,
    entryDate: toInputDate(),
    activityType: "INSPECTION",
    activity: "",
    weatherCondition: "",
    appliedProducts: "",
    observations: "",
  };
}

export function FieldDiaryPage() {
  const [plantings, setPlantings] = useState([]);
  const [entries, setEntries] = useState([]);
  const [selectedPlantingId, setSelectedPlantingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());

  const loadEntries = useCallback(async (plantingId) => {
    setLoading(true);
    try {
      const page = await api.getDiaryEntries(plantingId);
      setEntries(page.content);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api
      .getAllPlantings()
      .then((page) => setPlantings(page.content))
      .catch((requestError) => setError(requestError.message));
    loadEntries("");
  }, [loadEntries]);

  useEffect(() => {
    loadEntries(selectedPlantingId);
  }, [selectedPlantingId, loadEntries]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm(selectedPlantingId || plantings[0]?.id || ""));
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
      observations: entry.observations || "",
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
      weatherCondition: form.weatherCondition || null,
      appliedProducts: form.appliedProducts || null,
      observations: form.observations || null,
    };

    try {
      if (editing) {
        await api.updateDiaryEntry(editing.id, payload);
        setSuccess("Registro atualizado.");
      } else {
        await api.createDiaryEntry(payload);
        setSuccess("Atividade adicionada ao diário.");
      }
      setModalOpen(false);
      await loadEntries(selectedPlantingId);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(entry) {
    if (!window.confirm(`Excluir o registro “${entry.activity}”?`)) return;

    try {
      await api.deleteDiaryEntry(entry.id);
      setSuccess("Registro excluído.");
      await loadEntries(selectedPlantingId);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Rotina de campo"
        title="Diário da lavoura"
        description="Registre o que aconteceu em cada plantio e mantenha o histórico da safra."
        action={
          <button
            className="button button--primary"
            onClick={openCreate}
            disabled={plantings.length === 0}
          >
            <Plus size={18} /> Nova atividade
          </button>
        }
      />

      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      {plantings.length === 0 && !loading ? (
        <EmptyState
          title="Cadastre um plantio primeiro"
          description="Toda atividade do diário precisa estar ligada a uma cultura e safra."
          action={
            <Link className="button button--primary" to="/plantios">
              Ir para plantios
            </Link>
          }
        />
      ) : (
        <>
          <section className="diary-filter">
            <div>
              <span className="eyebrow">Filtrar histórico</span>
              <label>
                <span className="sr-only">Escolher plantio</span>
                <select
                  value={selectedPlantingId}
                  onChange={(event) =>
                    setSelectedPlantingId(event.target.value)
                  }
                >
                  <option value="">Todos os plantios</option>
                  {plantings.map((planting) => (
                    <option key={planting.id} value={planting.id}>
                      {planting.crop} — {planting.harvest}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <span>
              <BookOpenText size={22} />
              {entries.length} {entries.length === 1 ? "registro" : "registros"}
            </span>
          </section>

          {loading ? (
            <LoadingState label="Abrindo o diário..." />
          ) : entries.length === 0 ? (
            <EmptyState
              title="Nenhuma atividade registrada"
              description="Anote uma vistoria, aplicação ou outro trabalho realizado na lavoura."
              action={
                <button className="button button--primary" onClick={openCreate}>
                  <Plus size={18} /> Registrar atividade
                </button>
              }
            />
          ) : (
            <section className="diary-timeline">
              {entries.map((entry) => (
                <article key={entry.id} className="diary-entry">
                  <div className="diary-entry__date">
                    <strong>
                      {new Intl.DateTimeFormat("pt-BR", {
                        day: "2-digit",
                      }).format(new Date(`${entry.entryDate}T12:00:00`))}
                    </strong>
                    <span>
                      {new Intl.DateTimeFormat("pt-BR", {
                        month: "short",
                      }).format(new Date(`${entry.entryDate}T12:00:00`))}
                    </span>
                  </div>
                  <div className="diary-entry__content">
                    <header>
                      <div>
                        <span className="badge">{entry.activityTypeName}</span>
                        <h2>{entry.activity}</h2>
                        <small>
                          {entry.crop} · {entry.harvest} ·{" "}
                          {formatDate(entry.entryDate)}
                        </small>
                      </div>
                      <div className="card-actions">
                        <button
                          className="icon-button"
                          onClick={() => openEdit(entry)}
                          aria-label="Editar atividade"
                        >
                          <Edit3 size={17} />
                        </button>
                        <button
                          className="icon-button icon-button--danger"
                          onClick={() => handleDelete(entry)}
                          aria-label="Excluir atividade"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </header>
                    <div className="diary-entry__details">
                      {entry.weatherCondition && (
                        <span>
                          <CloudSun size={16} /> {entry.weatherCondition}
                        </span>
                      )}
                      {entry.appliedProducts && (
                        <span>
                          <FlaskConical size={16} /> {entry.appliedProducts}
                        </span>
                      )}
                    </div>
                    {entry.observations && <p>{entry.observations}</p>}
                  </div>
                </article>
              ))}
            </section>
          )}
        </>
      )}

      {modalOpen && (
        <Modal
          title={editing ? "Editar atividade" : "Nova atividade"}
          description="Registre o trabalho como ele aconteceu no campo."
          onClose={() => setModalOpen(false)}
        >
          <form className="form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label className="form-grid__full">
                <span>Plantio</span>
                <select
                  required
                  value={form.plantingId}
                  onChange={(event) =>
                    setForm({ ...form, plantingId: event.target.value })
                  }
                >
                  {plantings.map((planting) => (
                    <option key={planting.id} value={planting.id}>
                      {planting.crop} — {planting.harvest}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Data</span>
                <input
                  required
                  type="date"
                  max={toInputDate()}
                  value={form.entryDate}
                  onChange={(event) =>
                    setForm({ ...form, entryDate: event.target.value })
                  }
                />
              </label>
              <label>
                <span>Tipo</span>
                <select
                  value={form.activityType}
                  onChange={(event) =>
                    setForm({ ...form, activityType: event.target.value })
                  }
                >
                  {activityTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-grid__full">
                <span>Atividade realizada</span>
                <input
                  required
                  maxLength="160"
                  value={form.activity}
                  onChange={(event) =>
                    setForm({ ...form, activity: event.target.value })
                  }
                  placeholder="Ex.: Aplicação de fungicida"
                />
              </label>
              <label>
                <span>
                  Condição do tempo <small>(opcional)</small>
                </span>
                <input
                  maxLength="120"
                  value={form.weatherCondition}
                  onChange={(event) =>
                    setForm({ ...form, weatherCondition: event.target.value })
                  }
                  placeholder="Ex.: Nublado e sem vento"
                />
              </label>
              <label>
                <span>
                  Produtos usados <small>(opcional)</small>
                </span>
                <input
                  maxLength="500"
                  value={form.appliedProducts}
                  onChange={(event) =>
                    setForm({ ...form, appliedProducts: event.target.value })
                  }
                  placeholder="Ex.: Fungicida 2 L/ha"
                />
              </label>
              <label className="form-grid__full">
                <span>
                  Observações <small>(opcional)</small>
                </span>
                <textarea
                  rows="3"
                  maxLength="1000"
                  value={form.observations}
                  onChange={(event) =>
                    setForm({ ...form, observations: event.target.value })
                  }
                  placeholder="Anotações importantes da atividade"
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
              <button className="button button--primary" disabled={saving}>
                {saving ? "Salvando..." : "Salvar atividade"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
