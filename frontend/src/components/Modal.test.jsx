import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Modal } from "./Modal";

function ModalHarness({ closeOnBackdrop = false, dismissible = true }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Abrir formulário
      </button>
      {open && (
        <Modal
          title="Novo registro"
          description="Preencha os dados."
          onClose={() => setOpen(false)}
          closeOnBackdrop={closeOnBackdrop}
          dismissible={dismissible}
        >
          <form>
            <label>
              Nome
              <input aria-label="Nome" />
            </label>
            <button type="submit">Salvar</button>
          </form>
        </Modal>
      )}
    </>
  );
}

describe("Modal", () => {
  it("controla o foco e restaura a tela ao fechar", () => {
    render(<ModalHarness />);
    const openButton = screen.getByRole("button", {
      name: "Abrir formulário",
    });

    openButton.focus();
    fireEvent.click(openButton);

    expect(screen.getByRole("dialog")).toHaveAccessibleName("Novo registro");
    expect(screen.getByRole("dialog")).toHaveAccessibleDescription(
      "Preencha os dados.",
    );
    expect(screen.getByRole("textbox", { name: "Nome" })).toHaveFocus();
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.mouseDown(document.querySelector(".modal-backdrop"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const saveButton = screen.getByRole("button", { name: "Salvar" });
    saveButton.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(screen.getByRole("button", { name: "Fechar" })).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(openButton).toHaveFocus();
    expect(document.body.style.overflow).toBe("");
  });

  it("permite fechar pelo fundo somente quando o modal autoriza", () => {
    render(<ModalHarness closeOnBackdrop />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir formulário" }));

    fireEvent.mouseDown(document.querySelector(".modal-backdrop"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("impede o fechamento enquanto uma ação está em andamento", () => {
    render(<ModalHarness dismissible={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir formulário" }));

    expect(screen.getByRole("button", { name: "Fechar" })).toBeDisabled();
    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
