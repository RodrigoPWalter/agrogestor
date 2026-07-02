package br.com.agrogestor.planting.entity;

public enum PlantingStatus {
    ACTIVE("Ativo"),
    HARVESTED("Colhido");

    private final String displayName;

    PlantingStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
