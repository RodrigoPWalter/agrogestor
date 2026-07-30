package br.com.agrogestor.planting.entity;

public enum PlantingProgressStatus {
    NOT_STARTED("Não iniciado"),
    IN_PROGRESS("Em andamento"),
    COMPLETED("Área totalmente plantada");

    private final String displayName;

    PlantingProgressStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
