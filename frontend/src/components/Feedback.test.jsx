import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorBanner, SuccessBanner } from "./Feedback";

describe("avisos de retorno", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("permite fechar um aviso de erro", () => {
    const onDismiss = vi.fn();

    render(
      <ErrorBanner message="Não foi possível salvar." onDismiss={onDismiss} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Fechar aviso" }));

    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("fecha mensagens de sucesso após cinco segundos", () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();

    render(<SuccessBanner message="Registro salvo." onDismiss={onDismiss} />);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
