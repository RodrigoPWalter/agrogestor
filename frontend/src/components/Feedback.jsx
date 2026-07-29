import { AlertCircle, Inbox, LoaderCircle, X } from "lucide-react";
import { useEffect, useRef } from "react";

export function LoadingState({ label = "Carregando informações..." }) {
  return (
    <div className="state-box">
      <LoaderCircle className="spin" size={28} />
      <p>{label}</p>
    </div>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="state-box state-box--empty">
      <span className="state-box__icon">
        <Inbox size={28} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

function AlertBanner({
  message,
  type,
  role,
  icon: Icon,
  onDismiss,
  autoDismiss,
}) {
  const dismissRef = useRef(onDismiss);

  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!message || !autoDismiss || !dismissRef.current) return undefined;

    const timeoutId = window.setTimeout(() => dismissRef.current?.(), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [autoDismiss, message]);

  if (!message) return null;

  return (
    <div className={`alert alert--${type}`} role={role}>
      {Icon && <Icon size={18} />}
      <span>{message}</span>
      {onDismiss && (
        <button
          className="alert__close"
          type="button"
          onClick={onDismiss}
          aria-label="Fechar aviso"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

export function ErrorBanner({ message, onDismiss }) {
  return (
    <AlertBanner
      message={message}
      type="error"
      role="alert"
      icon={AlertCircle}
      onDismiss={onDismiss}
    />
  );
}

export function SuccessBanner({ message, onDismiss }) {
  return (
    <AlertBanner
      message={message}
      type="success"
      role="status"
      onDismiss={onDismiss}
      autoDismiss
    />
  );
}
