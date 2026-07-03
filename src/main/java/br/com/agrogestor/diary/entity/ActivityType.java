package br.com.agrogestor.diary.entity;

public enum ActivityType {
    PLANTING("Plantio"),
    FERTILIZATION("Adubação"),
    APPLICATION("Aplicação"),
    INSPECTION("Vistoria"),
    RAIN("Chuva"),
    PRODUCT_PURCHASE("Compra de produto"),
    PRODUCT_USE("Uso de produto"),
    MAINTENANCE("Manutenção"),
    OBSERVATION("Observação"),
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
