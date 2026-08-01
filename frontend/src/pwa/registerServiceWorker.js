import { registerSW } from "virtual:pwa-register";
import {
  markAppUpdateAvailable,
  scheduleServiceWorkerUpdates,
} from "./appUpdate";

let stopUpdateChecks;

export function registerAgroGestorServiceWorker() {
  registerSW({
    immediate: true,
    onNeedReload() {
      markAppUpdateAvailable();
    },
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;

      stopUpdateChecks?.();
      stopUpdateChecks = scheduleServiceWorkerUpdates(registration);
    },
  });
}
