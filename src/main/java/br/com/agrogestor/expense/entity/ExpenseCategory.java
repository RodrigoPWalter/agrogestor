package br.com.agrogestor.expense.entity;

public enum ExpenseCategory {
    SEEDS("Sementes"),
    FERTILIZERS("Fertilizantes"),
    PESTICIDES("Defensivos"),
    FUEL("Combustível"),
    MAINTENANCE("Manutenção"),
    LABOR("Mão de obra"),
    OTHER("Outros");

    private final String displayName;

    ExpenseCategory(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
