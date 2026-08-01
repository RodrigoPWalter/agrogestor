import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useSingleFlight } from "./useSingleFlight";

function deferred() {
  let resolve;
  const promise = new Promise((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

describe("useSingleFlight", () => {
  it("ignora uma segunda execucao enquanto a primeira esta pendente", async () => {
    const request = deferred();
    const action = vi.fn(() => request.promise);
    const { result } = renderHook(() => useSingleFlight());

    let firstRun;
    await act(async () => {
      firstRun = result.current.run(action);
      await result.current.run(action);
    });

    expect(action).toHaveBeenCalledOnce();
    expect(result.current.pending).toBe(true);

    await act(async () => {
      request.resolve("salvo");
      await firstRun;
    });

    expect(result.current.pending).toBe(false);
  });

  it("libera uma nova tentativa depois de uma falha", async () => {
    const action = vi
      .fn()
      .mockRejectedValueOnce(new Error("sem conexao"))
      .mockResolvedValueOnce("salvo");
    const { result } = renderHook(() => useSingleFlight());

    await act(async () => {
      await expect(result.current.run(action)).rejects.toThrow("sem conexao");
    });
    await act(async () => {
      await result.current.run(action);
    });

    expect(action).toHaveBeenCalledTimes(2);
    expect(result.current.pending).toBe(false);
  });
});
