import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  toInputDate,
} from "./formatters";

describe("formatters", () => {
  afterEach(() => vi.restoreAllMocks());

  it("formata valores monetários em reais", () => {
    expect(formatCurrency(3300)).toContain("3.300,00");
    expect(formatCurrency(3300)).toContain("R$");
  });

  it("formata números usando o padrão brasileiro", () => {
    expect(formatNumber(18.5)).toBe("18,5");
  });

  it("formata datas sem alterar o dia por causa do fuso horário", () => {
    expect(formatDate("2026-10-15")).toBe("15/10/2026");
  });

  it("usa os componentes locais da data nos formulários", () => {
    vi.spyOn(Date.prototype, "getFullYear").mockReturnValue(2026);
    vi.spyOn(Date.prototype, "getMonth").mockReturnValue(7);
    vi.spyOn(Date.prototype, "getDate").mockReturnValue(9);

    expect(toInputDate()).toBe("2026-08-09");
  });
});
