import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client";
import { AuthProvider, useAuth } from "./AuthContext";
import { readSession } from "./session";

vi.mock("../api/client", () => ({
  api: {
    login: vi.fn(),
  },
}));

function AuthConsumer() {
  const { isAuthenticated, login, logout, user } = useAuth();

  return (
    <>
      <span>{isAuthenticated ? user.nome : "Visitante"}</span>
      <button
        type="button"
        onClick={() =>
          login({
            email: "produtor@agrogestor.local",
            senha: "senha-segura",
          })
        }
      >
        Entrar
      </button>
      <button type="button" onClick={logout}>
        Sair
      </button>
    </>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    api.login.mockReset();
  });

  it("autentica, mantém a sessão e permite sair", async () => {
    api.login.mockResolvedValue({
      accessToken: "jwt-assinado",
      tokenType: "Bearer",
      expiresIn: 3600,
      user: {
        id: "89e6cbde-b162-4284-b13f-1fac801f7428",
        nome: "Rodrigo",
        email: "produtor@agrogestor.local",
        role: "ADMIN",
      },
    });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(screen.getByText("Rodrigo")).toBeInTheDocument();
    });
    expect(readSession()?.accessToken).toBe("jwt-assinado");

    fireEvent.click(screen.getByRole("button", { name: "Sair" }));

    expect(screen.getByText("Visitante")).toBeInTheDocument();
    expect(readSession()).toBeNull();
  });
});
