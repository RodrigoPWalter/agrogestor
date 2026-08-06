import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client";
import { UserManagementModal } from "./UserManagementModal";

vi.mock("../api/client", () => ({
  api: {
    getUsers: vi.fn(),
    createUser: vi.fn(),
  },
}));

describe("UserManagementModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getUsers.mockResolvedValue([]);
  });

  it("cria uma conta com propriedade independente", async () => {
    api.createUser.mockResolvedValue({
      id: "user-2",
      nome: "Conta Teste",
      email: "teste@agrogestor.app",
      role: "USER",
      propriedade: "Fazenda de testes",
    });
    render(<UserManagementModal onClose={vi.fn()} />);

    await screen.findByText("Nova conta independente");
    fireEvent.change(screen.getByLabelText("Nome da pessoa"), {
      target: { value: "Conta Teste" },
    });
    fireEvent.change(screen.getByLabelText("Nome da propriedade"), {
      target: { value: "Fazenda de testes" },
    });
    fireEvent.change(screen.getByLabelText("E-mail para entrar"), {
      target: { value: "teste@agrogestor.app" },
    });
    fireEvent.change(screen.getByLabelText("Senha inicial"), {
      target: { value: "senha-teste" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Criar conta" }));

    await waitFor(() =>
      expect(api.createUser).toHaveBeenCalledWith({
        nome: "Conta Teste",
        email: "teste@agrogestor.app",
        senha: "senha-teste",
        propriedade: "Fazenda de testes",
      }),
    );
    expect(await screen.findByText(/criada com dados separados/)).toBeVisible();
  });
});
