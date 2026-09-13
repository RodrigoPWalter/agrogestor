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
import { captureSessionContext, readSession, saveSession } from "./session";
import { readFormDraft, writeFormDraft } from "../utils/formDraft";
import {
  listQueuedRequests,
  putQueuedRequest,
  resetOfflineStorageForTests,
} from "../offline/offlineStorage";

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
    resetOfflineStorageForTests();
    api.login.mockReset();
    api.updateProfile.mockReset();
    vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
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
          id: "profile-owner",
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
        id: "profile-owner",
        nome: "Rodrigo Walter",
        email: "rodrigo@agro.local",
        role: "ADMIN",
      },
    });
    await putQueuedRequest({
      id: "lancamento-pendente",
      scope: "antigo@agro.local",
      createdAt: "2026-08-10T20:00:00.000Z",
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
    expect(await listQueuedRequests("antigo@agro.local")).toEqual([]);
    expect(
      await listQueuedRequests("user:profile-owner:property:none"),
    ).toHaveLength(1);
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

  it("entra no modo offline ao expirar o token e encerra no limite offline sem apagar o rascunho", async () => {
    vi.useFakeTimers();
    saveSession({
      accessToken: "a",
      expiresAt: Date.now() + 1000,
      offlineAccessUntil: Date.now() + 5000,
      user: { id: "a", nome: "Rodrigo", email: "a@local" },
    });
    writeFormDraft("diario", { activity: "Vistoria" });
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );
    vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(false);
    await act(async () => vi.advanceTimersByTime(1001));
    expect(screen.getByText("Rodrigo")).toBeInTheDocument();
    expect(readSession()?.offlineAccess).toBe(true);
    await act(async () => vi.advanceTimersByTime(4000));
    expect(screen.getByText("Visitante")).toBeInTheDocument();
    expect(readSession()).toBeNull();
    expect(readFormDraft("diario")).toBeNull();

    vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(true);
    api.login.mockResolvedValue({
      accessToken: "new-a",
      expiresIn: 3600,
      user: { id: "a", nome: "Rodrigo", email: "a@local" },
    });
    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: "Entrar" })),
    );
    expect(readFormDraft("diario")).toEqual({ activity: "Vistoria" });
  });

  it("não encerra a sessão nova por um aviso de expiração antigo", () => {
    saveSession({
      accessToken: "a",
      expiresAt: Date.now() + 60_000,
      user: { id: "a", nome: "A", email: "a@local" },
    });
    const previous = captureSessionContext();
    saveSession({
      accessToken: "b",
      expiresAt: Date.now() + 60_000,
      user: { id: "b", nome: "B", email: "b@local" },
    });
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );
    act(() =>
      window.dispatchEvent(
        new CustomEvent(AUTH_EXPIRED_EVENT, { detail: previous }),
      ),
    );
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(readSession()?.accessToken).toBe("b");
  });
});
