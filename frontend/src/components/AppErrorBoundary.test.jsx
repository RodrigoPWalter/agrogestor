import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppErrorBoundary } from "./AppErrorBoundary";

function BrokenContent() {
  throw new Error("falha ao carregar módulo");
}

describe("AppErrorBoundary", () => {
  it("mantém o conteúdo quando não há falhas", () => {
    render(
      <AppErrorBoundary>
        <p>Painel carregado</p>
      </AppErrorBoundary>,
    );

    expect(screen.getByText("Painel carregado")).toBeVisible();
  });

  it("oferece recuperação quando uma tela falha", () => {
    const onRetry = vi.fn();
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(
      <AppErrorBoundary onRetry={onRetry}>
        <BrokenContent />
      </AppErrorBoundary>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Não foi possível abrir esta tela",
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Recarregar AgroGestor" }),
    );
    expect(onRetry).toHaveBeenCalledOnce();

    consoleError.mockRestore();
  });
});
