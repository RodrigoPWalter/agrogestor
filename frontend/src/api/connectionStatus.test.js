import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CONNECTION_STATUS,
  getConnectionStatus,
  markApiReachable,
  markApiUnavailable,
  resetConnectionStatus,
  subscribeConnectionStatus,
} from "./connectionStatus";

describe("estado da conexão", () => {
  beforeEach(() => {
    resetConnectionStatus();
  });

  it("acompanha respostas e falhas de rede sem criar requisições", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeConnectionStatus(listener);

    markApiReachable();
    expect(getConnectionStatus()).toBe(CONNECTION_STATUS.CONNECTED);

    markApiUnavailable();
    expect(getConnectionStatus()).toBe(CONNECTION_STATUS.UNAVAILABLE);
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
  });
});
