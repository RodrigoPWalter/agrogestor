import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanupOfflineCache,
  getCachedResponse,
  listQueuedRequests,
  moveOfflineScope,
  putCachedResponse,
  putQueuedRequest,
  resetOfflineStorageForTests,
} from "./offlineStorage";

describe("armazenamento offline", () => {
  beforeEach(() => resetOfflineStorageForTests());
  afterEach(() => vi.useRealTimers());

  it("move lançamentos e respostas salvas quando o e-mail muda", async () => {
    await putQueuedRequest({
      id: "lancamento-1",
      scope: "antigo@agro.local",
      createdAt: "2026-08-10T20:00:00.000Z",
    });
    await putCachedResponse("antigo@agro.local", "/api/v1/dashboard", {
      activePlantings: 2,
    });

    await moveOfflineScope("antigo@agro.local", "novo@agro.local");

    expect(await listQueuedRequests("antigo@agro.local")).toEqual([]);
    expect(await listQueuedRequests("novo@agro.local")).toHaveLength(1);
    expect(
      await getCachedResponse("antigo@agro.local", "/api/v1/dashboard"),
    ).toBeNull();
    expect(
      await getCachedResponse("novo@agro.local", "/api/v1/dashboard"),
    ).toEqual({ activePlantings: 2 });
  });

  it("remove apenas respostas antigas do cache", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-01T12:00:00Z"));
    await putCachedResponse("usuario", "/antiga", { valor: 1 });
    vi.setSystemTime(new Date("2026-08-10T12:00:00Z"));
    await putCachedResponse("usuario", "/recente", { valor: 2 });

    await cleanupOfflineCache({
      maxAgeMs: 30 * 24 * 60 * 60 * 1000,
      now: Date.now(),
    });

    expect(await getCachedResponse("usuario", "/antiga")).toBeNull();
    expect(await getCachedResponse("usuario", "/recente")).toEqual({
      valor: 2,
    });
  });
});
