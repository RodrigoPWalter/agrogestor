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

export function BoletosPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [savingId, setSavingId] = useState(null);

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
        <div className="data-card-grid">
          {entries.map((entry) => (
            <article className="data-card" key={entry.id}>
              <div className="data-card__header">
                <div>
                  <h2>
                    {entry.products
                      ?.map((product) => product.productName)
                      .filter(Boolean)
                      .join(", ") || "Compra de produto"}
                  </h2>
                  <span className="badge">
                    {entry.boletoPaid
                      ? "Pago"
                      : entry.boletoDueDate < today
                        ? "Vencido"
                        : entry.boletoDueDate <= attentionLimit
                          ? "Vence em até 7 dias"
                          : "Pendente"}
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
    </div>
  );
}
