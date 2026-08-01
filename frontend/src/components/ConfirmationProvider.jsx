import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Modal } from "./Modal";

const ConfirmationContext = createContext(null);

export function ConfirmationProvider({ children }) {
  const [options, setOptions] = useState(null);
  const resolverRef = useRef(null);

  const closeConfirmation = useCallback((confirmed) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setOptions(null);
    resolve?.(confirmed);
  }, []);

  const requestConfirmation = useCallback((nextOptions) => {
    resolverRef.current?.(false);

    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setOptions({
        confirmLabel: "Confirmar",
        cancelLabel: "Cancelar",
        tone: "danger",
        ...nextOptions,
      });
    });
  }, []);

  useEffect(
    () => () => {
      resolverRef.current?.(false);
    },
    [],
  );

  const contextValue = useMemo(
    () => ({ requestConfirmation }),
    [requestConfirmation],
  );

  return (
    <ConfirmationContext.Provider value={contextValue}>
      {children}
      {options && (
        <Modal
          title={options.title}
          description={options.description}
          onClose={() => closeConfirmation(false)}
        >
          <div className="confirmation-dialog">
            {options.detail && <p>{options.detail}</p>}
            <div className="confirmation-dialog__actions">
              <button
                className="button button--ghost"
                type="button"
                data-autofocus
                onClick={() => closeConfirmation(false)}
              >
                {options.cancelLabel}
              </button>
              <button
                className={`button ${
                  options.tone === "danger"
                    ? "button--danger"
                    : "button--primary"
                }`}
                type="button"
                onClick={() => closeConfirmation(true)}
              >
                {options.confirmLabel}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </ConfirmationContext.Provider>
  );
}

export function useConfirmation() {
  const context = useContext(ConfirmationContext);

  if (context) return context.requestConfirmation;

  return ({ description }) => Promise.resolve(window.confirm(description));
}
