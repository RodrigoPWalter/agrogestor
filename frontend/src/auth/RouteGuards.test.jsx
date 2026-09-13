import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { useAuth } from "./AuthContext";
import { PrivateRoute, PublicOnlyRoute } from "./RouteGuards";

vi.mock("./AuthContext", () => ({
  useAuth: vi.fn(),
}));

function CurrentPath() {
  const location = useLocation();
  return <span>{location.pathname}</span>;
}

function PrivateForm() {
  const [text, setText] = useState("");
  return (
    <input
      aria-label="Anotação privada"
      value={text}
      onChange={(event) => setText(event.target.value)}
    />
  );
}

describe("proteção das rotas", () => {
  it("limpa o estado da página ao trocar de conta, mas não ao trocar o e-mail da mesma conta", () => {
    const user = { id: "a", propertyId: "farm-a", email: "antes@local" };
    useAuth.mockReturnValue({ isAuthenticated: true, user });
    const app = () => (
      <MemoryRouter initialEntries={["/gastos"]}>
        <Routes>
          <Route element={<PrivateRoute />}>
            <Route path="/gastos" element={<PrivateForm />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    const { rerender } = render(app());
    fireEvent.change(screen.getByLabelText("Anotação privada"), {
      target: { value: "Dados da conta A" },
    });
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { ...user, email: "depois@local" },
    });
    rerender(app());
    expect(screen.getByLabelText("Anotação privada")).toHaveValue(
      "Dados da conta A",
    );
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "b", propertyId: "farm-b", email: "depois@local" },
    });
    rerender(app());
    expect(screen.getByLabelText("Anotação privada")).toHaveValue("");
  });

  it("envia visitantes para a tela de login", () => {
    useAuth.mockReturnValue({ isAuthenticated: false });

    render(
      <MemoryRouter initialEntries={["/gastos"]}>
        <Routes>
          <Route element={<PrivateRoute />}>
            <Route path="/gastos" element={<span>Gastos privados</span>} />
          </Route>
          <Route path="/login" element={<CurrentPath />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("/login")).toBeInTheDocument();
    expect(screen.queryByText("Gastos privados")).not.toBeInTheDocument();
  });

  it("retorna uma sessão ativa à página solicitada", () => {
    useAuth.mockReturnValue({ isAuthenticated: true });

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
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<span>Login público</span>} />
          </Route>
          <Route path="/gastos" element={<CurrentPath />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("/gastos")).toBeInTheDocument();
    expect(screen.queryByText("Login público")).not.toBeInTheDocument();
  });
});
