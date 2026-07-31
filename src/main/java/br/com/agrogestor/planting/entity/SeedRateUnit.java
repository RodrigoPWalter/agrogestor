package br.com.agrogestor.planting.entity;

public enum SeedRateUnit {
    KILOGRAMS_PER_HECTARE("kg/ha"),
    SEEDS_PER_HECTARE("sementes/ha");

    private final String displayName;

    SeedRateUnit(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
