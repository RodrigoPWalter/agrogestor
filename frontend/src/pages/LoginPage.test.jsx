import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../auth/AuthContext";
import { LoginPage } from "./LoginPage";

vi.mock("../auth/AuthContext", () => ({
  useAuth: vi.fn(),
}));

describe("LoginPage", () => {
  const login = vi.fn();

  beforeEach(() => {
    login.mockReset();
    useAuth.mockReturnValue({ login });
  });

  it("autentica e retorna à página solicitada", async () => {
    login.mockResolvedValue({ nome: "Rodrigo" });

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/login",
            state: { from: { pathname: "/gastos" } },
          },
        ]}
      >
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/gastos" element={<span>Gastos por plantio</span>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "admin@agrogestor.local" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "AgroGestor@2026" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Entrar no AgroGestor" }),
    );

    await waitFor(() => {
      expect(screen.getByText("Gastos por plantio")).toBeInTheDocument();
    });
    expect(login).toHaveBeenCalledWith({
      email: "admin@agrogestor.local",
      password: "AgroGestor@2026",
    });
  });

  it("mostra o erro devolvido pela autenticação", async () => {
    login.mockRejectedValue(new Error("E-mail ou senha inválidos."));

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "admin@agrogestor.local" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "senha-incorreta" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Entrar no AgroGestor" }),
    );

    expect(
      await screen.findByRole("alert", {
        name: "",
      }),
    ).toHaveTextContent("E-mail ou senha inválidos.");
  });
});
