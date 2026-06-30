package br.com.agrogestor.inventory.entity;

public enum ProductType {
    SEED("Semente"),
    FERTILIZER("Fertilizante"),
    PESTICIDE("Defensivo");

    private final String displayName;

    ProductType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
