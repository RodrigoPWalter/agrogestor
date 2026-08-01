import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useLatestRequestGuard } from "./useLatestRequestGuard";

describe("useLatestRequestGuard", () => {
  it("aceita apenas a resposta da requisicao mais recente", () => {
    const { result } = renderHook(() => useLatestRequestGuard());

    const isFirstCurrent = result.current();
    const isSecondCurrent = result.current();

    expect(isFirstCurrent()).toBe(false);
    expect(isSecondCurrent()).toBe(true);
  });
});
