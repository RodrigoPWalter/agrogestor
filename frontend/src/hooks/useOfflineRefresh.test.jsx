import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OFFLINE_SYNC_COMPLETE_EVENT } from "../offline/offlineSync";
import { useOfflineRefresh } from "./useOfflineRefresh";

describe("useOfflineRefresh", () => {
  it("atualiza a tela quando a sincronização termina", () => {
    const refresh = vi.fn();
    renderHook(() => useOfflineRefresh(refresh));

    act(() => {
      window.dispatchEvent(new Event(OFFLINE_SYNC_COMPLETE_EVENT));
    });

    expect(refresh).toHaveBeenCalledOnce();
  });
});
