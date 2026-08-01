import { RefreshCw, X } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { getAppUpdateSnapshot, subscribeToAppUpdate } from "../pwa/appUpdate";

export function AppUpdateNotice({ reload = () => window.location.reload() }) {
  const update = useSyncExternalStore(
    subscribeToAppUpdate,
    getAppUpdateSnapshot,
    getAppUpdateSnapshot,
  );
  const [dismissedVersion, setDismissedVersion] = useState(null);

  useEffect(() => {
    if (update.available) setDismissedVersion(null);
  }, [update.available, update.version]);

  if (!update.available || dismissedVersion === update.version) return null;

  return (
    <aside className="app-update-notice" role="status" aria-live="polite">
      <span className="app-update-notice__icon" aria-hidden="true">
        <RefreshCw size={18} />
      </span>
      <div className="app-update-notice__content">
        <strong>Nova versão disponível</strong>
        <p>Atualize quando terminar o que estiver preenchendo.</p>
      </div>
      <button
        className="button button--primary app-update-notice__action"
        type="button"
        onClick={reload}
      >
        Atualizar
      </button>
      <button
        className="app-update-notice__close"
        type="button"
        onClick={() => setDismissedVersion(update.version)}
        aria-label="Lembrar da atualização depois"
        title="Lembrar depois"
      >
        <X size={18} />
      </button>
    </aside>
  );
}
