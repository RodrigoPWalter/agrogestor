import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

export function Modal({
  title,
  description,
  children,
  onClose,
  closeOnBackdrop = false,
  dismissible = true,
}) {
  const modalRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const dismissibleRef = useRef(dismissible);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    dismissibleRef.current = dismissible;
  }, [dismissible]);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousBodyOverflow = document.body.style.overflow;
    const modal = modalRef.current;
    const focusableSelector = [
      "button:not([disabled])",
      "a[href]",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
    ].join(",");

    document.body.style.overflow = "hidden";
    const initialFocus =
      modal?.querySelector("[data-autofocus]") ||
      modal?.querySelector(
        "input:not([disabled]), select:not([disabled]), textarea:not([disabled])",
      ) ||
      modal?.querySelector(focusableSelector);
    initialFocus?.focus();

    const handleKeyDown = (event) => {
      const openModals = [
        ...document.querySelectorAll('[role="dialog"][aria-modal="true"]'),
      ];
      if (openModals.at(-1) !== modal) return;

      if (event.key === "Escape") {
        event.preventDefault();
        if (dismissibleRef.current) onCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || !modal) return;

      const focusableElements = [...modal.querySelectorAll(focusableSelector)];
      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      previouslyFocused?.focus();
    };
  }, []);

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={closeOnBackdrop && dismissible ? onClose : undefined}
    >
      <section
        ref={modalRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal__header">
          <div>
            <h2 id={titleId}>{title}</h2>
            {description && <p id={descriptionId}>{description}</p>}
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            disabled={!dismissible}
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
