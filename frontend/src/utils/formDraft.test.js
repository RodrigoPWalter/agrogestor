import { beforeEach, describe, expect, it } from "vitest";
import { clearFormDraft, readFormDraft, writeFormDraft } from "./formDraft";
import { saveSession, clearSession } from "../auth/session";

function login(id = "one") {
  saveSession({
    accessToken: id,
    expiresAt: Date.now() + 60_000,
    user: { id, email: `${id}@local` },
  });
}

describe("formDraft", () => {
  beforeEach(() => {
    localStorage.clear();
    login();
  });

  it("salva e recupera o formulario do usuario", () => {
    writeFormDraft("diario", { activity: "Vistoria no milho" });

    expect(readFormDraft("diario")).toEqual({
      activity: "Vistoria no milho",
    });
  });

  it("remove o rascunho depois de sete dias", () => {
    writeFormDraft("gasto", { amount: "150" });
    const eightDaysLater = Date.now() + 8 * 24 * 60 * 60 * 1000;

    expect(readFormDraft("gasto", eightDaysLater)).toBeNull();
    expect(
      Object.keys(localStorage).filter((key) => key.includes(":draft:")),
    ).toHaveLength(0);
  });

  it("permite descartar um rascunho salvo", () => {
    writeFormDraft("plantio", { crop: "Milho" });

    clearFormDraft("plantio");

    expect(readFormDraft("plantio")).toBeNull();
  });

  it("preserva rascunhos após expiração/saída e não os mostra para outra conta", () => {
    writeFormDraft("diario", { activity: "Vistoria" });
    clearSession();
    expect(readFormDraft("diario")).toBeNull();
    login("two");
    expect(readFormDraft("diario")).toBeNull();
    login();
    expect(readFormDraft("diario")).toEqual({ activity: "Vistoria" });
  });

  it("uma conclusão antiga não apaga o rascunho da nova conta", () => {
    writeFormDraft("diario", { activity: "A" });
    login("two");
    writeFormDraft("diario", { activity: "B" });
    clearFormDraft("diario", "user:one:property:none");
    expect(readFormDraft("diario")).toEqual({ activity: "B" });
  });
});
