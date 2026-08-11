import { getAccessToken, getCurrentUserCacheScope } from "../auth/session";
import { httpClient } from "../api/httpClient";
import {
  deleteQueuedRequest,
  listQueuedRequests,
  putQueuedRequest,
  updateQueuedRequest,
} from "./offlineStorage";

export const OFFLINE_SYNC_COMPLETE_EVENT = "agrogestor:offline-sync-complete";
export const SESSION_READY_EVENT = "agrogestor:session-ready";

const listeners = new Set();
let initialized = false;
let syncPromise = null;
let snapshot = Object.freeze({
  pendingCount: 0,
  errorCount: 0,
  syncing: false,
});

function publish(nextState) {
  snapshot = Object.freeze({ ...snapshot, ...nextState });
  listeners.forEach((listener) => listener());
}

export function subscribeOfflineSync(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getOfflineSyncSnapshot() {
  return snapshot;
}

export async function refreshOfflineSyncState() {
  const requests = await listQueuedRequests(getCurrentUserCacheScope());
  publish({
    pendingCount: requests.length,
    errorCount: requests.filter((item) => item.status === "error").length,
  });
  return requests;
}

export function getOfflineRequests() {
  return listQueuedRequests(getCurrentUserCacheScope());
}

export async function queueMutation({ id, url, method, data, headers }) {
  const queuedHeaders = { ...headers };
  delete queuedHeaders.Authorization;

  await putQueuedRequest({
    id,
    scope: getCurrentUserCacheScope(),
    url,
    method,
    data: data ?? null,
    headers: queuedHeaders,
    status: "pending",
    attempts: 0,
    lastError: null,
    createdAt: new Date().toISOString(),
  });
  await refreshOfflineSyncState();
  return {
    offlineQueued: true,
    offlineRequestId: id,
  };
}

export async function syncPendingRequests() {
  if (syncPromise) return syncPromise;
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    await refreshOfflineSyncState();
    return { synchronized: 0, pending: snapshot.pendingCount };
  }
  const syncScope = getCurrentUserCacheScope();
  const syncToken = getAccessToken();
  if (!syncToken) {
    await refreshOfflineSyncState();
    return { synchronized: 0, pending: snapshot.pendingCount };
  }

  syncPromise = (async () => {
    publish({ syncing: true });
    let synchronized = 0;
    const requests = await listQueuedRequests(syncScope);

    for (const request of requests.filter((item) => item.status !== "error")) {
      if (
        getCurrentUserCacheScope() !== syncScope ||
        getAccessToken() !== syncToken
      ) {
        break;
      }
      try {
        await httpClient.request({
          url: request.url,
          method: request.method,
          data: request.data,
          headers: {
            ...request.headers,
            Authorization: `Bearer ${syncToken}`,
            "X-Idempotency-Key": request.id,
          },
        });
        await deleteQueuedRequest(request.id);
        synchronized += 1;
      } catch (error) {
        const recoverable = error.offlineEligible || error.status === 401;
        await updateQueuedRequest(request.id, {
          status: recoverable ? "pending" : "error",
          attempts: request.attempts + 1,
          lastError: error.message,
        });
        if (recoverable) break;
      }
    }

    const remaining = await refreshOfflineSyncState();
    if (synchronized > 0 && typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(OFFLINE_SYNC_COMPLETE_EVENT, {
          detail: { synchronized, pending: remaining.length },
        }),
      );
    }
    return { synchronized, pending: remaining.length };
  })().finally(() => {
    syncPromise = null;
    publish({ syncing: false });
  });

  return syncPromise;
}

export async function retryQueuedRequest(id) {
  await updateQueuedRequest(id, {
    status: "pending",
    lastError: null,
  });
  await refreshOfflineSyncState();
  return syncPendingRequests();
}

export async function discardQueuedRequest(id) {
  await deleteQueuedRequest(id);
  return refreshOfflineSyncState();
}

export function initializeOfflineSync() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  window.addEventListener("online", syncPendingRequests);
  window.addEventListener(SESSION_READY_EVENT, syncPendingRequests);
  refreshOfflineSyncState().catch(() => {});
}

export function isOfflineResult(result) {
  return result?.offlineQueued === true;
}
