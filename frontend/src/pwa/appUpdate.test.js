import { describe, expect, it, vi } from "vitest";
import { scheduleServiceWorkerUpdates } from "./appUpdate";

describe("scheduleServiceWorkerUpdates", () => {
  it("verifica atualização ao voltar para o aplicativo", async () => {
    const registration = { update: vi.fn().mockResolvedValue(undefined) };
    const windowObject = new EventTarget();
    windowObject.setInterval = vi.fn(() => 10);
    windowObject.clearInterval = vi.fn();
    const documentObject = new EventTarget();
    documentObject.visibilityState = "visible";

    const stop = scheduleServiceWorkerUpdates(registration, {
      windowObject,
      documentObject,
      navigatorObject: { onLine: true },
    });

    documentObject.dispatchEvent(new Event("visibilitychange"));
    await vi.waitFor(() => expect(registration.update).toHaveBeenCalledOnce());

    stop();
    expect(windowObject.clearInterval).toHaveBeenCalledWith(10);
  });

  it("não consulta a rede enquanto o aplicativo está offline", async () => {
    const registration = { update: vi.fn().mockResolvedValue(undefined) };
    const windowObject = new EventTarget();
    windowObject.setInterval = vi.fn(() => 11);
    windowObject.clearInterval = vi.fn();
    const documentObject = new EventTarget();
    documentObject.visibilityState = "visible";

    const stop = scheduleServiceWorkerUpdates(registration, {
      windowObject,
      documentObject,
      navigatorObject: { onLine: false },
    });

    windowObject.dispatchEvent(new Event("online"));
    await Promise.resolve();

    expect(registration.update).not.toHaveBeenCalled();
    stop();
  });
});
