import { beforeEach, describe, expect, it } from "vitest";
import {
  getCachedResponse,
  listQueuedRequests,
  moveOfflineScope,
  putCachedResponse,
  putQueuedRequest,
  resetOfflineStorageForTests,
} from "./offlineStorage";

describe("armazenamento offline", () => {
  beforeEach(() => resetOfflineStorageForTests());

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
});
