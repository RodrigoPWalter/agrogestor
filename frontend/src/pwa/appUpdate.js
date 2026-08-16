const listeners = new Set();

let snapshot = {
  available: false,
  version: 0,
};

const SERVICE_WORKER_UPDATE_INTERVAL_MS = 60 * 60 * 1000;

export function getAppUpdateSnapshot() {
  return snapshot;
}

export function subscribeToAppUpdate(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function markAppUpdateAvailable() {
  snapshot = {
    available: true,
    version: snapshot.version + 1,
  };
  listeners.forEach((listener) => listener());
}

export function clearAppUpdate() {
  snapshot = {
    ...snapshot,
    available: false,
  };
  listeners.forEach((listener) => listener());
}

export function scheduleServiceWorkerUpdates(
  registration,
  {
    windowObject = window,
    documentObject = document,
    navigatorObject = navigator,
    intervalMs = SERVICE_WORKER_UPDATE_INTERVAL_MS,
  } = {},
) {
  let updateInProgress = false;

  const checkForUpdate = async () => {
    const appIsVisible = documentObject.visibilityState === "visible";
    const appIsOnline = navigatorObject.onLine !== false;

    if (!appIsVisible || !appIsOnline || updateInProgress) return;

    updateInProgress = true;
    try {
      await registration.update();
    } catch {
      // A próxima verificação tenta novamente sem interromper o uso do aplicativo.
    } finally {
      updateInProgress = false;
    }
  };

  const handleVisibilityChange = () => {
    if (documentObject.visibilityState === "visible") {
      void checkForUpdate();
    }
  };

  const intervalId = windowObject.setInterval(checkForUpdate, intervalMs);
  documentObject.addEventListener("visibilitychange", handleVisibilityChange);
  windowObject.addEventListener("online", checkForUpdate);

  return () => {
    windowObject.clearInterval(intervalId);
    documentObject.removeEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );
    windowObject.removeEventListener("online", checkForUpdate);
  };
}
