import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getDashboardCacheKey,
  isSameLocalDay,
  readDashboardCache,
  writeDashboardCache,
} from "./dashboardCache";

vi.mock("../auth/session", () => ({
  buildUserCacheKey: (name) => `agrogestor:cache:teste@local:${name}`,
}));

describe("cache do dashboard", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("usa uma chave escopada pelo usuário", () => {
    expect(getDashboardCacheKey()).toBe(
      "agrogestor:cache:teste@local:dashboard:v1",
    );
  });

  it("grava e recupera os últimos dados do painel", () => {
    const cacheKey = getDashboardCacheKey();

    writeDashboardCache({ plantings: [{ id: "plantio-1" }] }, cacheKey);

    expect(readDashboardCache(cacheKey)).toEqual(
      expect.objectContaining({
        plantings: [{ id: "plantio-1" }],
      }),
    );
  });

  it("identifica datas do mesmo dia local", () => {
    expect(isSameLocalDay(new Date().toISOString())).toBe(true);
    expect(isSameLocalDay("2020-01-01T03:00:00.000Z")).toBe(false);
  });
});
