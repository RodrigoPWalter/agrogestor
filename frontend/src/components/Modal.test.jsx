import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Modal } from "./Modal";

function ModalHarness() {
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

    const saveButton = screen.getByRole("button", { name: "Salvar" });
    saveButton.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(screen.getByRole("button", { name: "Fechar" })).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(openButton).toHaveFocus();
    expect(document.body.style.overflow).toBe("");
  });
});
