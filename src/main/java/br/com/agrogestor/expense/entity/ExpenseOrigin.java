package br.com.agrogestor.expense.entity;

public enum ExpenseOrigin {
    DIRECT("Gasto direto"),
    STOCK_ALLOCATION("Custo transferido do estoque");

    private final String displayName;

    ExpenseOrigin(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
