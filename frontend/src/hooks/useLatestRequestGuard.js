import { useCallback, useRef } from "react";

export function useLatestRequestGuard() {
  const requestSequence = useRef(0);

  return useCallback(() => {
    const requestId = ++requestSequence.current;
    return () => requestId === requestSequence.current;
  }, []);
}
