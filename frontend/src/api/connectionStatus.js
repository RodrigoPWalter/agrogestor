export const CONNECTION_STATUS = {
  CHECKING: "checking",
  CONNECTED: "connected",
  OFFLINE: "offline",
  UNAVAILABLE: "unavailable",
};

const listeners = new Set();
let currentStatus =
  typeof navigator !== "undefined" && navigator.onLine === false
    ? CONNECTION_STATUS.OFFLINE
    : CONNECTION_STATUS.CHECKING;

function updateStatus(nextStatus) {
  if (nextStatus === currentStatus) return;
  currentStatus = nextStatus;
  listeners.forEach((listener) => listener());
}

export function getConnectionStatus() {
  return currentStatus;
}

export function subscribeConnectionStatus(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function markApiReachable() {
  updateStatus(CONNECTION_STATUS.CONNECTED);
}

export function markApiUnavailable() {
  updateStatus(
    typeof navigator !== "undefined" && navigator.onLine === false
      ? CONNECTION_STATUS.OFFLINE
      : CONNECTION_STATUS.UNAVAILABLE,
  );
}

export function resetConnectionStatus() {
  updateStatus(CONNECTION_STATUS.CHECKING);
}

if (typeof window !== "undefined") {
  window.addEventListener("online", resetConnectionStatus);
  window.addEventListener("offline", markApiUnavailable);
}
