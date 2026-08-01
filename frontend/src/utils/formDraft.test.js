import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearFormDraft, readFormDraft, writeFormDraft } from "./formDraft";

vi.mock("../auth/session", () => ({
  buildUserCacheKey: (name) => `agrogestor:cache:usuario:${name}`,
}));

describe("formDraft", () => {
  beforeEach(() => localStorage.clear());

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
    expect(localStorage.length).toBe(0);
  });

  it("permite descartar um rascunho salvo", () => {
    writeFormDraft("plantio", { crop: "Milho" });

    clearFormDraft("plantio");

    expect(readFormDraft("plantio")).toBeNull();
  });
});
