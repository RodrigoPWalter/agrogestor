package br.com.agrogestor.inventory.entity;

public enum MeasurementUnit {
    LITER("L"),
    KILOGRAM("Kg"),
    UNIT("Unidade");

    private final String displayName;

    MeasurementUnit(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
