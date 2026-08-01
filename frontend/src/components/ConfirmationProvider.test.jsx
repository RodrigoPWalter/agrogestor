import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { ConfirmationProvider, useConfirmation } from "./ConfirmationProvider";
import { Modal } from "./Modal";

function ConfirmationHarness({ insideModal = false }) {
  const requestConfirmation = useConfirmation();
  const [result, setResult] = useState("");

  async function handleAction() {
    const confirmed = await requestConfirmation({
      title: "Excluir registro?",
      description: "O registro será removido.",
      confirmLabel: "Excluir",
    });
    setResult(confirmed ? "confirmado" : "cancelado");
  }

  const content = (
    <>
      <button type="button" onClick={handleAction}>
        Solicitar exclusão
      </button>
      <output>{result}</output>
    </>
  );

  return insideModal ? (
    <Modal title="Detalhes do plantio" onClose={() => {}}>
      {content}
    </Modal>
  ) : (
    content
  );
}

describe("ConfirmationProvider", () => {
  it("confirma uma ação sem usar a caixa nativa do navegador", async () => {
    render(
      <ConfirmationProvider>
        <ConfirmationHarness />
      </ConfirmationProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Solicitar exclusão" }));
    expect(
      screen.getByRole("dialog", { name: "Excluir registro?" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toHaveFocus();

    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));

    await waitFor(() => expect(screen.getByText("confirmado")).toBeVisible());
  });

  it("fecha apenas a confirmação quando ela está sobre outro modal", async () => {
    render(
      <ConfirmationProvider>
        <ConfirmationHarness insideModal />
      </ConfirmationProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Solicitar exclusão" }));
    expect(screen.getAllByRole("dialog")).toHaveLength(2);

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => expect(screen.getByText("cancelado")).toBeVisible());
    expect(
      screen.getByRole("dialog", { name: "Detalhes do plantio" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: "Excluir registro?" }),
    ).not.toBeInTheDocument();
  });
});
