import { useCallback, useRef, useState } from "react";

export function useSingleFlight() {
  const runningRef = useRef(false);
  const [pending, setPending] = useState(false);

  const run = useCallback(async (action) => {
    if (runningRef.current) {
      return undefined;
    }

    runningRef.current = true;
    setPending(true);

    try {
      return await action();
    } finally {
      runningRef.current = false;
      setPending(false);
    }
  }, []);

  return { pending, run };
}
