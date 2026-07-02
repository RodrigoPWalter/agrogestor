package br.com.agrogestor.diary.entity;

public enum ActivityType {
    PLANTING("Plantio"),
    FERTILIZATION("Adubação"),
    APPLICATION("Aplicação"),
    INSPECTION("Vistoria"),
    HARVEST("Colheita"),
    OTHER("Outra atividade");

    private final String displayName;

    ActivityType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
