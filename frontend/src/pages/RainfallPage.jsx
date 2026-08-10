import { CloudRain, Droplets, Edit3, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useConfirmation } from "../components/ConfirmationProvider";
import {
  EmptyState,
  ErrorBanner,
  LoadingState,
  SuccessBanner,
} from "../components/Feedback";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { formatDate, formatNumber, toInputDate } from "../utils/formatters";
import { useSingleFlight } from "../hooks/useSingleFlight";
import { mutationFeedback } from "../offline/offlineFeedback";
import { isOfflineResult } from "../offline/offlineSync";

const emptyForm = {
  measurementDate: toInputDate(),
  millimeters: "",
  notes: "",
};

export function RainfallPage() {
  const requestConfirmation = useConfirmation();
  const [measurements, setMeasurements] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const { pending: saving, run: runSaving } = useSingleFlight();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  async function loadData({ showLoading = true } = {}) {
    if (showLoading) setLoading(true);
    try {
      const [items, totals] = await Promise.all([
        api.getRainfall(),
        api.getRainfallSummary(),
      ]);
      setMeasurements(items);
      setSummary(totals);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({
      measurementDate: item.measurementDate,
      millimeters: item.millimeters,
      notes: item.notes || "",
    });
    setModalOpen(true);
  }

  async function submit(event) {
    event.preventDefault();
    await runSaving(async () => {
      const payload = {
        ...form,
        millimeters: Number(form.millimeters),
        notes: form.notes || null,
      };
      try {
        if (editing) {
          const result = await api.updateRainfall(editing.id, payload);
          setSuccess(mutationFeedback(result, "Medição atualizada."));
          if (isOfflineResult(result)) {
            setModalOpen(false);
            return;
          }
        } else {
          const result = await api.createRainfall(payload);
          setSuccess(mutationFeedback(result, "Chuva registrada."));
          if (isOfflineResult(result)) {
            setModalOpen(false);
            return;
          }
        }
        setModalOpen(false);
        await loadData({ showLoading: false });
      } catch (requestError) {
        setError(requestError.message);
      }
    });
  }

  async function remove(item) {
    const confirmed = await requestConfirmation({
      title: "Excluir registro de chuva?",
      description: `A medição de ${formatDate(item.measurementDate)} será removida do histórico.`,
      confirmLabel: "Excluir medição",
    });
    if (!confirmed) return;
    try {
      const result = await api.deleteRainfall(item.id);
      setSuccess(mutationFeedback(result, "Medição excluída."));
      if (isOfflineResult(result)) return;
      await loadData({ showLoading: false });
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Pluviômetro"
        title="Registro de chuvas"
        description="Anote a chuva medida na propriedade e acompanhe o acumulado."
        action={
          <button className="button button--primary" onClick={openCreate}>
            <Plus size={18} /> Registrar chuva
          </button>
        }
      />
      <ErrorBanner message={error} onDismiss={() => setError("")} />
      <SuccessBanner message={success} onDismiss={() => setSuccess("")} />

      <section className="module-summary-grid">
        <article>
          <span>
            <CloudRain />
          </span>
          <div>
            <small>Acumulado no mês</small>
            <strong>{formatNumber(summary?.currentMonthTotal)} mm</strong>
          </div>
        </article>
        <article>
          <span>
            <Droplets />
          </span>
          <div>
            <small>Últimos 30 dias</small>
            <strong>{formatNumber(summary?.lastThirtyDaysTotal)} mm</strong>
          </div>
        </article>
        <article>
          <span>
            <CloudRain />
          </span>
          <div>
            <small>Última medição</small>
            <strong>
              {summary?.lastMeasurementDate
                ? `${formatNumber(summary.lastMeasurementMillimeters)} mm`
                : "—"}
            </strong>
          </div>
        </article>
      </section>

      {loading ? (
        <LoadingState label="Somando as chuvas..." />
      ) : measurements.length === 0 ? (
        <EmptyState
          title="Nenhuma chuva registrada"
          description="Quando chover, informe a data e os milímetros medidos."
          action={
            <button className="button button--primary" onClick={openCreate}>
              <Plus size={18} /> Primeira medição
            </button>
          }
        />
      ) : (
        <section className="panel">
          <div className="panel__header">
            <div>
              <span className="eyebrow">Histórico</span>
              <h2>Medições do pluviômetro</h2>
            </div>
          </div>
          <div className="rainfall-list">
            {measurements.map((item) => (
              <article key={item.id}>
                <span className="rainfall-value">
                  <Droplets size={18} /> {formatNumber(item.millimeters)} mm
                </span>
                <div>
                  <strong>{formatDate(item.measurementDate)}</strong>
                  <small>{item.notes || "Sem observações"}</small>
                </div>
                <div className="card-actions">
                  <button
                    className="icon-button"
                    onClick={() => openEdit(item)}
                    aria-label="Editar medição"
                  >
                    <Edit3 size={17} />
                  </button>
                  <button
                    className="icon-button icon-button--danger"
                    onClick={() => remove(item)}
                    aria-label="Excluir medição"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {modalOpen && (
        <Modal
          title={editing ? "Editar medição" : "Registrar chuva"}
          description="Use a leitura do pluviômetro da propriedade."
          onClose={() => setModalOpen(false)}
          dismissible={!saving}
        >
          <form className="form" onSubmit={submit}>
            <div className="form-grid">
              <label>
                <span>Data</span>
                <input
                  required
                  type="date"
                  max={toInputDate()}
                  value={form.measurementDate}
                  onChange={(e) =>
                    setForm({ ...form, measurementDate: e.target.value })
                  }
                />
              </label>
              <label>
                <span>Chuva medida (mm)</span>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.millimeters}
                  onChange={(e) =>
                    setForm({ ...form, millimeters: e.target.value })
                  }
                />
              </label>
              <label className="form-grid__full">
                <span>
                  Observações <small>(opcional)</small>
                </span>
                <textarea
                  rows="3"
                  maxLength="500"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </label>
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setModalOpen(false)}
                disabled={saving}
              >
                Cancelar
              </button>
              <button className="button button--primary" disabled={saving}>
                {saving ? "Salvando..." : "Salvar medição"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
