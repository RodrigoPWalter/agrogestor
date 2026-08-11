import { useEffect, useState } from "react";
import {
  discardQueuedRequest,
  getOfflineRequests,
  retryQueuedRequest,
  syncPendingRequests,
} from "../offline/offlineSync";
import { formatDateTime } from "../utils/formatters";
import { Modal } from "./Modal";

function requestLabel(path) {
  if (path.includes("field-diary")) return "Registro no diário";
  if (path.includes("rainfall")) return "Registro de chuva";
  if (path.includes("expenses")) return "Lançamento de gasto";
  if (path.includes("inventory")) return "Movimentação de estoque";
  if (path.includes("maintenance")) return "Registro de manutenção";
  if (path.includes("machines")) return "Alteração de máquina";
  if (path.includes("plantings")) return "Alteração de plantio";
  return "Lançamento pendente";
}

export function OfflineSyncPanel({ onClose }) {
  const [requests, setRequests] = useState([]);
  const [working, setWorking] = useState(false);

  async function load() {
    setRequests(await getOfflineRequests());
  }

  useEffect(() => {
    load();
  }, []);

  async function syncAll() {
    setWorking(true);
    try {
      await syncPendingRequests();
      await load();
    } finally {
      setWorking(false);
    }
  }

  async function retry(id) {
    setWorking(true);
    try {
      await retryQueuedRequest(id);
      await load();
    } finally {
      setWorking(false);
    }
  }

  async function discard(id) {
    if (!window.confirm("Descartar este lançamento salvo no aparelho?")) return;
    await discardQueuedRequest(id);
    await load();
  }

  return (
    <Modal
      title="Sincronização"
      description="Lançamentos guardados neste aparelho e ainda não confirmados no servidor."
      onClose={onClose}
      size="medium"
      className="offline-sync-modal"
    >
      <div className="offline-sync-panel">
        {requests.length === 0 ? (
          <p className="offline-sync-panel__empty">
            Tudo certo. Não há lançamentos aguardando envio.
          </p>
        ) : (
          <div className="offline-sync-list">
            {requests.map((request) => (
              <article className="offline-sync-item" key={request.id}>
                <div>
                  <strong>{requestLabel(request.url)}</strong>
                  <span>{formatDateTime(request.createdAt)}</span>
                  {request.status === "error" && (
                    <small>{request.lastError}</small>
                  )}
                </div>
                <div className="offline-sync-item__actions">
                  {request.status === "error" ? (
                    <button
                      type="button"
                      className="button button--ghost offline-sync-button"
                      disabled={working}
                      onClick={() => retry(request.id)}
                    >
                      Tentar de novo
                    </button>
                  ) : (
                    <span className="status-pill">Aguardando internet</span>
                  )}
                  <button
                    type="button"
                    className="button button--ghost offline-sync-button"
                    disabled={working}
                    onClick={() => discard(request.id)}
                  >
                    Descartar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="offline-sync-panel__footer">
          <button
            type="button"
            className="button button--ghost"
            onClick={onClose}
          >
            Fechar
          </button>
          {requests.some((request) => request.status !== "error") && (
            <button
              type="button"
              className="button button--primary"
              disabled={working || navigator.onLine === false}
              onClick={syncAll}
            >
              {working ? "Sincronizando..." : "Sincronizar agora"}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
