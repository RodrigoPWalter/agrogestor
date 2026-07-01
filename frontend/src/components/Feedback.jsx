import { AlertCircle, Inbox, LoaderCircle } from "lucide-react";

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

export function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="alert alert--error" role="alert">
      <AlertCircle size={18} />
      <span>{message}</span>
    </div>
  );
}

export function SuccessBanner({ message }) {
  if (!message) return null;
  return (
    <div className="alert alert--success" role="status">
      <span>{message}</span>
    </div>
  );
}
