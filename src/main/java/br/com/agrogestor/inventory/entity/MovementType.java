package br.com.agrogestor.inventory.entity;

public enum MovementType {
    ENTRY("Entrada"),
    EXIT("Saída");

    private final String displayName;

    MovementType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
