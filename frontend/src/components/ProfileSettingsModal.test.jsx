import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProfileSettingsModal } from "./ProfileSettingsModal";

const user = {
  nome: "Administrador",
  email: "admin@agrogestor.local",
};

describe("ProfileSettingsModal", () => {
  it("impede o envio quando a confirmaÃ§Ã£o da senha nÃ£o confere", async () => {
    const onSave = vi.fn();
    render(
      <ProfileSettingsModal user={user} onClose={vi.fn()} onSave={onSave} />,
    );

    fireEvent.change(screen.getByLabelText("Senha atual"), {
      target: { value: "senha-atual" },
    });
    fireEvent.change(screen.getByLabelText("Nova senha (opcional)"), {
      target: { value: "nova-senha" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar nova senha"), {
      target: { value: "outra-senha" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Salvar/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/nova senha/);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("envia os dados e limpa as senhas depois de salvar", async () => {
    const onSave = vi.fn().mockResolvedValue(user);
    render(
      <ProfileSettingsModal user={user} onClose={vi.fn()} onSave={onSave} />,
    );

    fireEvent.change(screen.getByLabelText("E-mail para entrar"), {
      target: { value: "rodrigo@agro.local" },
    });
    fireEvent.change(screen.getByLabelText("Senha atual"), {
      target: { value: "senha-atual" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Salvar/ }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        nome: "Administrador",
        email: "rodrigo@agro.local",
        senhaAtual: "senha-atual",
        novaSenha: null,
      });
    });
    expect(
      await screen.findByText("Dados de acesso atualizados."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Senha atual")).toHaveValue("");
  });
});
