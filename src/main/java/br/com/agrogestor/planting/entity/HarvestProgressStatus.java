package br.com.agrogestor.planting.entity;

public enum HarvestProgressStatus {
    NOT_STARTED("Não iniciada"),
    IN_PROGRESS("Em andamento"),
    COMPLETED("Área totalmente colhida");

    private final String displayName;

    HarvestProgressStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
