package br.com.agrogestor.task.entity;

public enum FarmTaskCategory {
    GENERAL("Geral"),
    PLANTING("Plantio"),
    MACHINE("Máquina"),
    INVENTORY("Estoque"),
    PURCHASE("Compra"),
    OTHER("Outro");

    private final String displayName;

    FarmTaskCategory(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
