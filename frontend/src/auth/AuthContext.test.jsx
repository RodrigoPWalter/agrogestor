import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client";
import { AUTH_EXPIRED_EVENT } from "../api/httpClient";
import { AuthProvider, useAuth } from "./AuthContext";
import { readSession } from "./session";

vi.mock("../api/client", () => ({
  api: {
    login: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

function AuthConsumer() {
  const { authNotice, isAuthenticated, login, logout, updateProfile, user } =
    useAuth();

  return (
    <>
      <span>{isAuthenticated ? user.nome : "Visitante"}</span>
      <span>{authNotice || "Sem aviso"}</span>
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
      <button
        type="button"
        onClick={() =>
          updateProfile({
            nome: "Rodrigo Walter",
            email: "rodrigo@agro.local",
            senhaAtual: "senha-antiga",
            novaSenha: "senha-nova",
          })
        }
      >
        Atualizar perfil
      </button>
    </>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    api.login.mockReset();
    api.updateProfile.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
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

  it("substitui a sessão depois de atualizar o perfil", async () => {
    localStorage.setItem(
      "agrogestor.auth",
      JSON.stringify({
        accessToken: "jwt-antigo",
        tokenType: "Bearer",
        expiresAt: Date.now() + 60_000,
        user: {
          nome: "Rodrigo",
          email: "antigo@agro.local",
          role: "ADMIN",
        },
      }),
    );
    api.updateProfile.mockResolvedValue({
      accessToken: "jwt-novo",
      tokenType: "Bearer",
      expiresIn: 3600,
      user: {
        nome: "Rodrigo Walter",
        email: "rodrigo@agro.local",
        role: "ADMIN",
      },
    });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Atualizar perfil" }));

    await waitFor(() => {
      expect(screen.getByText("Rodrigo Walter")).toBeInTheDocument();
    });
    expect(readSession()?.accessToken).toBe("jwt-novo");
    expect(readSession()?.user.email).toBe("rodrigo@agro.local");
  });

  it("encerra a sessão quando a API informa que o token expirou", () => {
    localStorage.setItem(
      "agrogestor.auth",
      JSON.stringify({
        accessToken: "jwt-expirado",
        expiresAt: Date.now() + 60_000,
        user: {
          nome: "Rodrigo",
          email: "produtor@agrogestor.local",
        },
      }),
    );

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    act(() => window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT)));

    expect(screen.getByText("Visitante")).toBeInTheDocument();
    expect(
      screen.getByText("Sua sessão expirou. Entre novamente para continuar."),
    ).toBeInTheDocument();
    expect(readSession()).toBeNull();
  });

  it("encerra a sessão automaticamente no horário de expiração", () => {
    vi.useFakeTimers();
    localStorage.setItem(
      "agrogestor.auth",
      JSON.stringify({
        accessToken: "jwt-curto",
        expiresAt: Date.now() + 1_000,
        user: {
          nome: "Rodrigo",
          email: "produtor@agrogestor.local",
        },
      }),
    );

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    act(() => vi.advanceTimersByTime(1_001));

    expect(screen.getByText("Visitante")).toBeInTheDocument();
    expect(readSession()).toBeNull();
  });
});
