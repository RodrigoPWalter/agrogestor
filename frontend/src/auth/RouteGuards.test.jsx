import { render, screen } from "@testing-library/react";
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

describe("proteção das rotas", () => {
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
