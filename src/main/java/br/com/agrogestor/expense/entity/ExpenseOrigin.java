package br.com.agrogestor.expense.entity;

public enum ExpenseOrigin {
    DIRECT("Gasto direto"),
    DIARY("Lançamento pelo Diário"),
    STOCK_ALLOCATION("Custo transferido do estoque"),
    MAINTENANCE("Manutenção de máquina");

    private final String displayName;

    ExpenseOrigin(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
