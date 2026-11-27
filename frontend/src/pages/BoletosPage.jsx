import { useEffect, useState } from "react";
import { api } from "../api/client";
import {
  EmptyState,
  ErrorBanner,
  LoadingState,
  SuccessBanner,
} from "../components/Feedback";
import { PageHeader } from "../components/PageHeader";
import { useOfflineRefresh } from "../hooks/useOfflineRefresh";
import { isOfflineResult } from "../offline/offlineSync";
import { formatCurrency, formatDate, toInputDate } from "../utils/formatters";
import "../styles/boletos.css";

const filters = [
  { value: "all", label: "Todos" },
  { value: "overdue", label: "Vencidos" },
  { value: "dueSoon", label: "Próximos do vencimento" },
  { value: "pending", label: "A vencer" },
  { value: "paid", label: "Pagos" },
];

const statusLabels = {
  overdue: "Vencido",
  dueSoon: "Vence em até 7 dias",
  pending: "A vencer",
  paid: "Pago",
};

export function BoletosPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [filter, setFilter] = useState("all");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const page = await api.getDiaryEntries();
      setEntries(
        page.content
          .filter(
            (item) =>
              item.activityType === "PRODUCT_PURCHASE" && item.boletoDueDate,
          )
          .sort((a, b) => a.boletoDueDate.localeCompare(b.boletoDueDate)),
      );
      setLoadFailed(false);
    } catch (requestError) {
      setLoadFailed(true);
      setError(requestError.message || "Não foi possível carregar os boletos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);
  useOfflineRefresh(load);

  async function changeStatus(entry) {
    if (savingId) return;
    setSavingId(entry.id);
    setError("");
    setSuccess("");
    try {
      const result = await api.updateBoletoStatus(entry.id, !entry.boletoPaid);
      if (isOfflineResult(result)) {
        setSuccess(
          "Alteração salva neste aparelho e aguardando envio. A lista será atualizada após a sincronização.",
        );
      } else {
        setEntries((current) =>
          current.map((item) =>
            item.id === entry.id
              ? { ...item, boletoPaid: result.boletoPaid }
              : item,
          ),
        );
        setSuccess(
          result.boletoPaid
            ? "Boleto marcado como pago."
            : "Boleto marcado como pendente.",
        );
      }
    } catch (requestError) {
      setError(requestError.message || "Não foi possível atualizar o boleto.");
    } finally {
      setSavingId(null);
    }
  }

  const today = toInputDate();
  const attentionDate = new Date();
  attentionDate.setDate(attentionDate.getDate() + 7);
  const attentionLimit = `${attentionDate.getFullYear()}-${String(attentionDate.getMonth() + 1).padStart(2, "0")}-${String(attentionDate.getDate()).padStart(2, "0")}`;
  function getStatus(entry) {
    if (entry.boletoPaid) return "paid";
    if (entry.boletoDueDate < today) return "overdue";
    if (entry.boletoDueDate <= attentionLimit) return "dueSoon";
    return "pending";
  }
  const filteredEntries = entries.filter(
    (entry) => filter === "all" || getStatus(entry) === filter,
  );
  return (
    <div className="page">
      <PageHeader
        eyebrow="Controle financeiro"
        title="Boletos"
        description="Acompanhe os vencimentos das compras registradas no Diário."
      />
      <ErrorBanner message={error} onDismiss={() => setError("")} />
      <SuccessBanner message={success} onDismiss={() => setSuccess("")} />
      {loading ? (
        <LoadingState label="Carregando boletos..." />
      ) : loadFailed && entries.length === 0 ? (
        <button type="button" className="button button--ghost" onClick={load}>
          Tentar novamente
        </button>
      ) : entries.length === 0 ? (
        <EmptyState
          title="Nenhum boleto cadastrado"
          description="Ao registrar uma compra no Diário, informe o vencimento e o nome no boleto."
        />
      ) : (
        <>
          <section
            className="boleto-filters"
            aria-label="Filtrar boletos por situação"
          >
            <div className="boleto-filters__heading">
              <h2>Filtrar boletos</h2>
              <p>Próximos do vencimento: hoje e os próximos 7 dias.</p>
            </div>
            <div className="boleto-filters__buttons">
              {filters.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`boleto-filter boleto-filter--${option.value}`}
                  aria-pressed={filter === option.value}
                  onClick={() => setFilter(option.value)}
                >
                  {option.label}
                  <span aria-hidden="true">
                    {option.value === "all"
                      ? entries.length
                      : entries.filter(
                          (entry) => getStatus(entry) === option.value,
                        ).length}
                  </span>
                </button>
              ))}
            </div>
            <p className="boleto-filters__count" role="status">
              {filteredEntries.length}{" "}
              {filteredEntries.length === 1
                ? "boleto encontrado"
                : "boletos encontrados"}
            </p>
          </section>
          {filteredEntries.length === 0 ? (
            <EmptyState
              title="Nenhum boleto nesta situação"
              description="Escolha outro filtro para visualizar seus boletos."
            />
          ) : (
            <div className="data-card-grid boleto-grid">
              {filteredEntries.map((entry) => (
                <article
                  className={`data-card boleto-card boleto-card--${getStatus(entry)}`}
                  key={entry.id}
                >
                  <div className="data-card__header">
                    <div>
                      <h2>
                        {entry.products
                          ?.map((product) => product.productName)
                          .filter(Boolean)
                          .join(", ") || "Compra de produto"}
                      </h2>
                      <span
                        className={`badge boleto-badge boleto-badge--${getStatus(entry)}`}
                      >
                        {statusLabels[getStatus(entry)]}
                      </span>
                    </div>
                  </div>
                  <dl className="details-list">
                    <div>
                      <dt>Vencimento</dt>
                      <dd>{formatDate(entry.boletoDueDate)}</dd>
                    </div>
                    <div>
                      <dt>Em nome de</dt>
                      <dd>{entry.boletoName}</dd>
                    </div>
                    <div>
                      <dt>Fornecedor</dt>
                      <dd>{entry.supplier || "Não informado"}</dd>
                    </div>
                    <div>
                      <dt>Valor da compra</dt>
                      <dd>
                        {entry.amount != null
                          ? formatCurrency(entry.amount)
                          : "Não informado"}
                      </dd>
                    </div>
                  </dl>
                  <button
                    className="button button--ghost button--wide"
                    type="button"
                    disabled={Boolean(savingId)}
                    onClick={() => changeStatus(entry)}
                  >
                    {savingId === entry.id
                      ? "Salvando..."
                      : entry.boletoPaid
                        ? "Marcar como pendente"
                        : "Marcar como pago"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
