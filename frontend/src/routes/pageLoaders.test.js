import { describe, expect, it, vi } from "vitest";
import { schedulePrivatePagesPreload } from "./pageLoaders";

describe("pré-carregamento das telas", () => {
  it("carrega os módulos quando o navegador fica ocioso", () => {
    const firstLoader = vi.fn().mockResolvedValue({});
    const secondLoader = vi.fn().mockResolvedValue({});
    const requestIdleCallback = vi.fn((callback) => {
      callback();
      return 17;
    });
    const cancelIdleCallback = vi.fn();

    const cancel = schedulePrivatePagesPreload({
      windowObject: { requestIdleCallback, cancelIdleCallback },
      online: true,
      loaders: [firstLoader, secondLoader],
    });

    expect(requestIdleCallback).toHaveBeenCalledWith(expect.any(Function), {
      timeout: 2500,
    });
    expect(firstLoader).toHaveBeenCalledOnce();
    expect(secondLoader).toHaveBeenCalledOnce();

    cancel();
    expect(cancelIdleCallback).toHaveBeenCalledWith(17);
  });

  it("não baixa telas adicionais quando o aparelho está offline", () => {
    const loader = vi.fn().mockResolvedValue({});

    schedulePrivatePagesPreload({
      windowObject: {},
      online: false,
      loaders: [loader],
    });

    expect(loader).not.toHaveBeenCalled();
  });
});
