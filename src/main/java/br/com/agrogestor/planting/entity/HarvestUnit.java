package br.com.agrogestor.planting.entity;

import java.math.BigDecimal;

public enum HarvestUnit {
    BAGS_60_KG("sacas de 60 kg", new BigDecimal("60")),
    KILOGRAMS("kg", BigDecimal.ONE),
    TONNES("toneladas", new BigDecimal("1000"));

    private final String displayName;
    private final BigDecimal kilogramsFactor;

    HarvestUnit(String displayName, BigDecimal kilogramsFactor) {
        this.displayName = displayName;
        this.kilogramsFactor = kilogramsFactor;
    }

    public String getDisplayName() {
        return displayName;
    }

    public BigDecimal toKilograms(BigDecimal quantity) {
        return quantity.multiply(kilogramsFactor);
    }
}
