import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanupOfflineCache,
  getCachedResponse,
  listQueuedRequests,
  moveOfflineScope,
  migrateLegacyOfflineData,
  putCachedResponse,
  putQueuedRequest,
  resetOfflineStorageForTests,
} from "./offlineStorage";
import { AUTH_STORAGE_KEY, readSession, saveSession } from "../auth/session";

describe("armazenamento offline", () => {
  beforeEach(() => {
    localStorage.clear();
    return resetOfflineStorageForTests();
  });
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

  it("migra fila e rascunho legados somente com associação local de email/ID", async () => {
    const user = { id: "one", propertyId: "farm", email: "old@local" };
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        accessToken: "old",
        expiresAt: Date.now() + 1000,
        user,
      }),
    );
    localStorage.setItem(
      "agrogestor:cache:old@local:draft:diario:v1",
      "rascunho-original",
    );
    await putQueuedRequest({
      id: "legacy",
      scope: "old@local",
      createdAt: "2026-08-10",
    });
    await putCachedResponse("old@local", "/example", { owner: "one" });
    readSession();
    saveSession({
      accessToken: "new",
      expiresAt: Date.now() + 60_000,
      user: { ...user, email: "new@local" },
    });
    await migrateLegacyOfflineData({ ...user, email: "new@local" });
    expect(await listQueuedRequests("user:one:property:farm")).toHaveLength(1);
    expect(await listQueuedRequests("old@local")).toEqual([]);
    expect(
      await getCachedResponse("user:one:property:farm", "/example"),
    ).toEqual({ owner: "one" });
    expect(
      localStorage.getItem(
        "agrogestor:cache:user:one:property:farm:draft:diario:v1",
      ),
    ).toBe("rascunho-original");
  });

  it("email reaproveitado não adota nem descarta registros legados sem prova", async () => {
    const user = { id: "new-owner", email: "shared@local" };
    await putQueuedRequest({
      id: "legacy",
      scope: user.email,
      createdAt: "2026-08-10",
    });
    saveSession({ accessToken: "new", expiresAt: Date.now() + 60_000, user });
    await migrateLegacyOfflineData(user);
    expect(await listQueuedRequests("user:new-owner:property:none")).toEqual(
      [],
    );
    expect(await listQueuedRequests(user.email)).toHaveLength(1);
  });

  it("preserva ambas as cópias quando a migração encontra cache e rascunho mais novos", async () => {
    const user = { id: "one", email: "old@local" };
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        accessToken: "old",
        expiresAt: Date.now() + 1000,
        user,
      }),
    );
    readSession();
    localStorage.setItem("agrogestor:cache:old@local:draft:diario:v1", "old");
    localStorage.setItem(
      "agrogestor:cache:user:one:property:none:draft:diario:v1",
      "new",
    );
    await putCachedResponse("old@local", "/example", { version: "old" });
    await putCachedResponse("user:one:property:none", "/example", {
      version: "new",
    });
    await migrateLegacyOfflineData(user);
    expect(await getCachedResponse("old@local", "/example")).toEqual({
      version: "old",
    });
    expect(
      await getCachedResponse("user:one:property:none", "/example"),
    ).toEqual({ version: "new" });
    expect(
      localStorage.getItem("agrogestor:cache:old@local:draft:diario:v1"),
    ).toBe("old");
    expect(
      localStorage.getItem(
        "agrogestor:cache:user:one:property:none:draft:diario:v1",
      ),
    ).toBe("new");
  });
});
