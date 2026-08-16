import { useEffect, useRef } from "react";
import { OFFLINE_SYNC_COMPLETE_EVENT } from "../offline/offlineSync";

export function useOfflineRefresh(refresh) {
  const refreshRef = useRef(refresh);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    const handleSynchronization = () => refreshRef.current?.();
    window.addEventListener(OFFLINE_SYNC_COMPLETE_EVENT, handleSynchronization);
    return () =>
      window.removeEventListener(
        OFFLINE_SYNC_COMPLETE_EVENT,
        handleSynchronization,
      );
  }, []);
}
