import { describe, expect, it, vi } from "vitest";
import { createPageLoader, preloadPrivatePage } from "./pageLoaders";

describe("pré-carregamento das telas", () => {
  it("reutiliza a importação quando a mesma tela é solicitada novamente", () => {
    const firstRequest = preloadPrivatePage("/gastos", {
      online: true,
      connection: undefined,
    });
    const secondRequest = preloadPrivatePage("/gastos", {
      online: true,
      connection: undefined,
    });

    expect(firstRequest).toBe(secondRequest);
  });

  it.each([
    ["sem internet", false, undefined],
    ["com economia de dados", true, { saveData: true }],
    ["em conexão 2G", true, { effectiveType: "2g" }],
  ])("não antecipa módulos %s", (_scenario, online, connection) => {
    expect(
      preloadPrivatePage("/estoque", { online, connection }),
    ).toBeUndefined();
  });

  it("permite tentar novamente quando uma importação falha", async () => {
    const importPage = vi
      .fn()
      .mockRejectedValueOnce(new Error("falha temporária"))
      .mockResolvedValueOnce({ ExamplePage: () => null });
    const loadPage = createPageLoader(importPage, "ExamplePage");

    await expect(loadPage()).rejects.toThrow("falha temporária");
    await expect(loadPage()).resolves.toEqual({
      default: expect.any(Function),
    });
    expect(importPage).toHaveBeenCalledTimes(2);
  });
});
