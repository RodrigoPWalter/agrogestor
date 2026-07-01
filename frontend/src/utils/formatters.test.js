import { describe, expect, it } from "vitest";
import { formatCurrency, formatDate, formatNumber } from "./formatters";

describe("formatters", () => {
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
});
