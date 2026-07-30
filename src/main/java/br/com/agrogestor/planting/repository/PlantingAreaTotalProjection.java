package br.com.agrogestor.planting.repository;

import java.math.BigDecimal;
import java.util.UUID;

public interface PlantingAreaTotalProjection {
    UUID getPlantingId();

    BigDecimal getPlantedArea();
}
